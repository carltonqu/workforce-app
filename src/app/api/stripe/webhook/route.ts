import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Tier } from "@/lib/tier";
import crypto from "crypto";

export const maxDuration = 30;

// Verify Stripe webhook signature without the SDK
function verifyStripeSignature(body: string, signature: string, secret: string): boolean {
  try {
    const parts = signature.split(",").reduce((acc: Record<string, string>, part) => {
      const [k, v] = part.split("=");
      acc[k] = v;
      return acc;
    }, {});

    const timestamp = parts["t"];
    const sig = parts["v1"];
    if (!timestamp || !sig) return false;

    const signed = `${timestamp}.${body}`;
    const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
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
  console.log(`[webhook] Updated org ${orgId} → tier=${tier} status=${stripeStatus}`);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();

  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 });
  }

  if (!verifyStripeSignature(body, sig, webhookSecret)) {
    console.error("[webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log(`[webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object;
        const orgId = cs.metadata?.orgId;
        const plan = cs.metadata?.plan as "PRO" | "ADVANCED" | undefined;
        console.log(`[webhook] checkout.session.completed orgId=${orgId} plan=${plan}`);
        if (orgId && plan && PLAN_TIERS[plan]) {
          await updateOrgTier(orgId, PLAN_TIERS[plan], "active", cs.subscription);
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const orgId = sub.metadata?.orgId;
        const plan = sub.metadata?.plan as "PRO" | "ADVANCED" | undefined;
        console.log(`[webhook] subscription.updated orgId=${orgId} plan=${plan} status=${sub.status}`);
        if (orgId) {
          const tier: Tier = plan && PLAN_TIERS[plan] ? PLAN_TIERS[plan] : "FREE";
          await updateOrgTier(orgId, tier, sub.status, sub.id);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const orgId = sub.metadata?.orgId;
        console.log(`[webhook] subscription.deleted orgId=${orgId}`);
        if (orgId) await updateOrgTier(orgId, "FREE", "canceled");
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        console.log(`[webhook] payment_failed customerId=${customerId}`);
        if (customerId) {
          const org = await prisma.organization.findFirst({ where: { stripeCustomerId: customerId } });
          if (org) {
            await prisma.organization.update({ where: { id: org.id }, data: { stripeStatus: "past_due" } });
          }
        }
        break;
      }
      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    console.error("[webhook] Handler error:", err.message);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
