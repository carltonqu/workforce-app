// Tier and feature access utilities

export type Tier = "FREE" | "PRO" | "ADVANCED";
export type Feature =
  | "employees"
  | "attendance"
  | "scheduling"
  | "payroll"
  | "performance"
  | "approvals"
  | "assets"
  | "announcements"
  | "finance"
  | "notifications"
  | "reports";

export const TIER_LABELS: Record<Tier, string> = {
  FREE: "Free",
  PRO: "Pro",
  ADVANCED: "Advanced",
};

export const TIER_COLORS: Record<Tier, string> = {
  FREE: "bg-gray-100 text-gray-700",
  PRO: "bg-blue-100 text-blue-700",
  ADVANCED: "bg-purple-100 text-purple-700",
};

const FEATURE_ACCESS: Record<Feature, Tier[]> = {
  employees: ["FREE", "PRO", "ADVANCED"],
  attendance: ["FREE", "PRO", "ADVANCED"],
  scheduling: ["PRO", "ADVANCED"],
  payroll: ["ADVANCED"],
  performance: ["PRO", "ADVANCED"],
  approvals: ["FREE", "PRO", "ADVANCED"],
  assets: ["PRO", "ADVANCED"],
  announcements: ["FREE", "PRO", "ADVANCED"],
  finance: ["ADVANCED"],
  notifications: ["FREE", "PRO", "ADVANCED"],
  reports: ["ADVANCED"],
};

export function hasFeatureAccess(tier: Tier, feature: Feature): boolean {
  return FEATURE_ACCESS[feature]?.includes(tier) ?? false;
}

export function trialDaysLeft(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const end = new Date(trialEndsAt);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function isTrialExpired(
  tier: Tier,
  trialEndsAt: string | null,
  stripeStatus: string | null
): boolean {
  if (tier !== "FREE") return false;
  if (stripeStatus === "active" || stripeStatus === "trialing") return false;
  if (!trialEndsAt) return false;
  return trialDaysLeft(trialEndsAt) === 0;
}
