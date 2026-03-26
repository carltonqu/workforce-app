import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Extend Vercel function timeout to 30s
export const maxDuration = 30;

async function stripePost(path: string, params: Record<string, string>, secretKey: string) {
  const body = new URLSearchParams(params).toString();
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2024-06-20",
    },
    body,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`[stripe] POST ${path} failed:`, JSON.stringify(data));
    throw new Error(data?.error?.message ?? "Stripe API error");
  }
  return data;
}

async function stripeGet(path: string, secretKey: string) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Stripe-Version": "2024-06-20",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "Stripe API error");
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    const { plan } = await req.json() as { plan: "PRO" | "ADVANCED" };

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

    const priceId = (plan === "PRO"
      ? process.env.STRIPE_PRICE_PRO
      : process.env.STRIPE_PRICE_ADVANCED)?.trim();

    if (!priceId) {
      return NextResponse.json({
        error: "Stripe price not configured. Add STRIPE_PRICE_PRO / STRIPE_PRICE_ADVANCED to env vars.",
      }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({ where: { id: user.orgId } });
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    const appUrl = process.env.NEXTAUTH_URL ?? "https://clockroster.com";

    // Get or create Stripe customer
    let customerId: string = org.stripeCustomerId ?? "";
    if (!customerId || customerId === "") {
      const customer = await stripePost("/customers", {
        email: user.email ?? "",
        name: org.name,
        "metadata[orgId]": org.id,
      }, secretKey);
      customerId = customer.id;
      await prisma.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Create checkout session
    const checkoutSession = await stripePost("/checkout/sessions", {
      customer: customerId,
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: "https://clockroster.com/settings",
      cancel_url: "https://clockroster.com/settings",
      "metadata[orgId]": org.id,
      "metadata[plan]": plan,
      "subscription_data[metadata][orgId]": org.id,
      "subscription_data[metadata][plan]": plan,
    }, secretKey);

    console.log("[stripe/checkout] session:", JSON.stringify({ id: checkoutSession.id, url: checkoutSession.url, status: checkoutSession.status }));

    const url = checkoutSession.url;
    if (!url) {
      console.error("[stripe/checkout] No URL returned:", JSON.stringify(checkoutSession));
      return NextResponse.json({ error: "Stripe did not return a checkout URL. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json({ error: err?.message || "Checkout failed" }, { status: 500 });
  }
}
