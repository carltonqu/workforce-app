import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STRIPE_PRICE_IDS } from "@/lib/tier";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-02-25.clover",
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const { plan } = await req.json() as { plan: "PRO" | "ADVANCED" };

  const priceId = STRIPE_PRICE_IDS[plan];
  if (!priceId) {
    return NextResponse.json({ error: "Stripe price not configured for this plan. Add STRIPE_PRICE_PRO / STRIPE_PRICE_ADVANCED to env." }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({ where: { id: user.orgId } });
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  // Create or retrieve Stripe customer
  let customerId = org.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: org.name,
      metadata: { orgId: org.id },
    });
    customerId = customer.id;
    await prisma.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customer.id },
    });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://clockroster.com";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings?upgraded=1`,
    cancel_url: `${appUrl}/settings?canceled=1`,
    metadata: { orgId: org.id, plan },
    subscription_data: { metadata: { orgId: org.id, plan } },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
