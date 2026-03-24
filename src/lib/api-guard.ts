/**
 * Backend API guard — call this in any protected route.
 * Returns a NextResponse error if the user lacks access, or null if allowed.
 *
 * Usage:
 *   const guard = await requireFeature(req, "payroll");
 *   if (guard) return guard;
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasFeatureAccess, isTrialExpired, type Feature, type Tier } from "@/lib/tier";
import { prisma } from "@/lib/prisma";

export async function requireFeature(feature: Feature): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const role = user.role ?? "EMPLOYEE";
  const isAdmin = role === "MANAGER" || role === "HR";

  // Non-admins (employees/supervisors) bypass billing entirely
  if (!isAdmin) return null;

  const tier = (user.tier ?? "FREE") as Tier;

  // Check trial expiry from DB (don't trust session cache for billing)
  let stripeStatus: string | null = null;
  let trialEndsAt: string | null = null;
  if (user.orgId) {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: user.orgId },
        select: { stripeStatus: true, trialEndsAt: true, tier: true },
      });
      stripeStatus = org?.stripeStatus ?? null;
      trialEndsAt = org?.trialEndsAt?.toISOString() ?? null;
      // Use DB tier (source of truth)
      const dbTier = (org?.tier ?? tier) as Tier;

      if (isTrialExpired(dbTier, trialEndsAt, stripeStatus)) {
        return NextResponse.json({
          error: "Your trial has expired. Please upgrade to continue.",
          code: "TRIAL_EXPIRED",
        }, { status: 402 });
      }

      if (!hasFeatureAccess(dbTier, feature)) {
        return NextResponse.json({
          error: `This feature requires a higher plan. Current plan: ${dbTier}.`,
          code: "PLAN_REQUIRED",
          required: feature,
        }, { status: 403 });
      }
    } catch {
      // If DB check fails, fall back to session tier
      if (!hasFeatureAccess(tier, feature)) {
        return NextResponse.json({
          error: "This feature requires a higher plan.",
          code: "PLAN_REQUIRED",
        }, { status: 403 });
      }
    }
  }

  return null;
}
