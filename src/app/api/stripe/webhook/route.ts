import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import type { Tier } from "@/lib/tier";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-02-24.acacia",
});

const PLAN_TIERS: Record<string, Tier> = {
  PRO:      "PRO",
  ADVANCED: "ADVANCED",
};

async function updateOrgTier(orgId: string, tier: Tier, stripeStatus: string, subscriptionId?: string) {
  // Update org
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      tier,
      stripeStatus,
      ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
    },
  });
  // Update all users in the org to the same tier
  await prisma.user.updateMany({
    where: { orgId },
    data: { tier },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Invalid signature:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.orgId;
        const plan  = session.metadata?.plan as "PRO" | "ADVANCED" | undefined;
        if (orgId && plan && PLAN_TIERS[plan]) {
          await updateOrgTier(orgId, PLAN_TIERS[plan], "active", session.subscription as string);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.orgId;
        const plan  = sub.metadata?.plan as "PRO" | "ADVANCED" | undefined;
        if (orgId) {
          const tier: Tier = plan && PLAN_TIERS[plan] ? PLAN_TIERS[plan] : "FREE";
          await updateOrgTier(orgId, tier, sub.status, sub.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.orgId;
        if (orgId) {
          await updateOrgTier(orgId, "FREE", "canceled");
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const sub = invoice.subscription
          ? await stripe.subscriptions.retrieve(invoice.subscription as string)
          : null;
        const orgId = sub?.metadata?.orgId;
        if (orgId) {
          await prisma.organization.update({
            where: { id: orgId },
            data: { stripeStatus: "past_due" },
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (err: any) {
    console.error("[Stripe Webhook] Handler error:", err.message);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
