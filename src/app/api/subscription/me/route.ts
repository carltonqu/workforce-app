import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  const org = user.orgId
    ? await prisma.organization.findUnique({
        where: { id: user.orgId },
        select: {
          tier: true,
          trialEndsAt: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          stripeStatus: true,
        },
      })
    : null;

  const trialEndsAt = org?.trialEndsAt ?? null;
  const now = Date.now();
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now) / 86400000))
    : null;

  const tier = org?.tier ?? user.tier ?? "FREE";
  const stripeStatus = org?.stripeStatus ?? null;

  const isTrialExpired =
    tier === "FREE" &&
    stripeStatus !== "active" &&
    stripeStatus !== "trialing" &&
    trialEndsAt !== null &&
    new Date(trialEndsAt).getTime() < now;

  return NextResponse.json({
    plan: tier,
    status: isTrialExpired ? "expired" : (stripeStatus ?? (tier === "FREE" ? "trialing" : "active")),
    trialEndsAt,
    trialDaysLeft,
    stripeStatus,
    hasActiveSubscription: !!org?.stripeSubscriptionId && stripeStatus === "active",
    features: {
      employees: true,
      attendance: true,
      performance: true,
      announcements: tier === "PRO" || tier === "ADVANCED",
      approvals: tier === "PRO" || tier === "ADVANCED",
      scheduling: tier === "PRO" || tier === "ADVANCED",
      assets: tier === "PRO" || tier === "ADVANCED",
      notifications: tier === "PRO" || tier === "ADVANCED",
      payroll: tier === "ADVANCED",
      finance: tier === "ADVANCED",
      reports: tier === "ADVANCED",
    },
  });
}
