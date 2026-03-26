import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import type { Tier } from "@/lib/tier";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2024-06-20", maxNetworkRetries: 0 });
}

const PLAN_TIERS: Record<string, Tier> = {
  PRO: "PRO",
  ADVANCED: "ADVANCED",
};

async function updateOrgTier(orgId: string, tier: Tier, stripeStatus: string, subscriptionId?: string) {
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      tier,
      stripeStatus,
      ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
    },
  });
  await prisma.user.updateMany({ where: { orgId }, data: { tier } });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const stripe = getStripe();

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
        const cs = event.data.object as Stripe.Checkout.Session;
        const orgId = cs.metadata?.orgId;
        const plan = cs.metadata?.plan as "PRO" | "ADVANCED" | undefined;
        if (orgId && plan && PLAN_TIERS[plan]) {
          await updateOrgTier(orgId, PLAN_TIERS[plan], "active", cs.subscription as string);
          // Mark org as fully active (clear pending status)
          await prisma.organization.update({
            where: { id: orgId },
            data: { stripeStatus: "active" },
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.orgId;
        const plan = sub.metadata?.plan as "PRO" | "ADVANCED" | undefined;
        if (orgId) {
          const tier: Tier = plan && PLAN_TIERS[plan] ? PLAN_TIERS[plan] : "FREE";
          await updateOrgTier(orgId, tier, sub.status, sub.id);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.orgId;
        if (orgId) await updateOrgTier(orgId, "FREE", "canceled");
        break;
      }
      case "invoice.payment_failed": {
        // Use customer metadata to find org
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : (invoice.customer as any)?.id;
        if (customerId) {
          const org = await prisma.organization.findFirst({
            where: { stripeCustomerId: customerId },
          });
          if (org) {
            await prisma.organization.update({
              where: { id: org.id },
              data: { stripeStatus: "past_due" },
            });
          }
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
