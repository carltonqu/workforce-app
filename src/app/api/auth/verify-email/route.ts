import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

function getDb() {
  return createClient({
    url: (process.env.DATABASE_URL ?? "").replace("libsql://", "https://"),
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2024-06-20", maxNetworkRetries: 0 });
}

async function ensureTables(db: ReturnType<typeof getDb>) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS EmailVerification (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      companyName TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      code TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);
  try { await db.execute("ALTER TABLE User ADD COLUMN emailVerified INTEGER DEFAULT 1"); } catch {}
  try { await db.execute("ALTER TABLE EmailVerification ADD COLUMN selectedPlan TEXT DEFAULT 'free'"); } catch {}
}

function getPlanPriceMap(): Record<string, string | undefined> {
  return {
    pro:     process.env.STRIPE_PRICE_PRO,
    advance: process.env.STRIPE_PRICE_ADVANCED,
  };
}

const PLAN_TIER_MAP: Record<string, "FREE" | "PRO" | "ADVANCED"> = {
  free:    "FREE",
  pro:     "PRO",
  advance: "ADVANCED",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const code = String(body?.code || "").trim();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required" }, { status: 400 });
    }

    const db = getDb();
    await ensureTables(db);

    const row = await db.execute({
      sql: "SELECT * FROM EmailVerification WHERE LOWER(email)=? LIMIT 1",
      args: [email],
    });

    const pending = row.rows[0];
    if (!pending) {
      return NextResponse.json({ error: "No pending verification found for this email" }, { status: 404 });
    }

    if ((pending.code as string) !== code) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    if (new Date(pending.expiresAt as string).getTime() < Date.now()) {
      return NextResponse.json({ error: "Verification code expired. Please request a new one." }, { status: 400 });
    }

    const selectedPlan = ((pending.selectedPlan as string) || "free").toLowerCase();
    const isPaid = selectedPlan === "pro" || selectedPlan === "advance";

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await db.execute({ sql: "DELETE FROM EmailVerification WHERE email=?", args: [email] });
      return NextResponse.json({ error: "Email already verified. Please login." }, { status: 409 });
    }

    // ── FREE plan: create account immediately ──
    if (!isPaid) {
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const org = await prisma.organization.create({
        data: {
          name: String(pending.companyName),
          tier: "FREE",
          trialEndsAt,
          stripeStatus: "trialing",
        },
      });

      const user = await prisma.user.create({
        data: {
          name: String(pending.name),
          email,
          password: String(pending.passwordHash),
          role: "MANAGER",
          tier: "FREE",
          orgId: org.id,
        },
      });

      await db.execute({ sql: "UPDATE User SET emailVerified=1 WHERE id=?", args: [user.id] });
      await db.execute({ sql: "DELETE FROM EmailVerification WHERE email=?", args: [email] });

      return NextResponse.json({
        success: true,
        plan: "free",
        message: "Account created. You can now login.",
        redirectTo: "/login",
      });
    }

    // ── PAID plan: create org/user in pending state, then redirect to Stripe ──
    const tier = PLAN_TIER_MAP[selectedPlan];
    const priceId = getPlanPriceMap()[selectedPlan];

    if (!priceId) {
      return NextResponse.json({
        error: "Payment not configured. Please contact support.",
      }, { status: 400 });
    }

    // Create org with pending status
    const org = await prisma.organization.create({
      data: {
        name: String(pending.companyName),
        tier: "FREE", // will be upgraded by webhook after payment
        stripeStatus: "pending",
      },
    });

    // Create user with pending account status
    const user = await prisma.user.create({
      data: {
        name: String(pending.name),
        email,
        password: String(pending.passwordHash),
        role: "MANAGER",
        tier: "FREE", // will be upgraded by webhook
        orgId: org.id,
      },
    });

    await db.execute({ sql: "UPDATE User SET emailVerified=1 WHERE id=?", args: [user.id] });
    await db.execute({ sql: "DELETE FROM EmailVerification WHERE email=?", args: [email] });

    // Create Stripe customer + checkout session
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Payment system not configured." }, { status: 500 });
    }

    const customer = await stripe.customers.create({
      email,
      name: String(pending.name),
      metadata: { orgId: org.id, userId: user.id },
    });

    await prisma.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customer.id },
    });

    const appUrl = process.env.NEXTAUTH_URL ?? "https://clockroster.com";

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/login?payment=success&plan=${selectedPlan}`,
      cancel_url: `${appUrl}/signup?canceled=1`,
      metadata: { orgId: org.id, userId: user.id, plan: tier },
      subscription_data: {
        metadata: { orgId: org.id, userId: user.id, plan: tier },
      },
    });

    return NextResponse.json({
      success: true,
      plan: selectedPlan,
      requiresPayment: true,
      checkoutUrl: session.url,
      message: `Email verified. Redirecting to payment for ${tier} plan.`,
    });

  } catch (error: any) {
    console.error("[verify-email]", error);
    return NextResponse.json({ error: error?.message || "Verification failed" }, { status: 500 });
  }
}
