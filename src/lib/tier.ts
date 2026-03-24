export type Tier = "FREE" | "PRO" | "ADVANCED";

export type Feature =
  | "employees"
  | "attendance"
  | "performance"
  | "scheduling"
  | "announcements"
  | "approvals"
  | "assets"
  | "time-tracking"
  | "notifications"
  | "role-based-access"
  | "payroll"
  | "finance"
  | "reports";

/**
 * FREE  = Trial / Limited — employees, attendance, performance only
 * PRO   = Core features — adds scheduling, announcements, approvals, assets, notifications
 * ADVANCED = Full access — adds payroll + finance/reports
 */
const TIER_FEATURES: Record<Tier, Feature[]> = {
  FREE: [
    "employees",
    "attendance",
    "performance",
    "time-tracking",
    "role-based-access",
  ],
  PRO: [
    "employees",
    "attendance",
    "performance",
    "time-tracking",
    "role-based-access",
    "scheduling",
    "announcements",
    "approvals",
    "assets",
    "notifications",
  ],
  ADVANCED: [
    "employees",
    "attendance",
    "performance",
    "time-tracking",
    "role-based-access",
    "scheduling",
    "announcements",
    "approvals",
    "assets",
    "notifications",
    "payroll",
    "finance",
    "reports",
  ],
};

export function hasFeatureAccess(tier: Tier, feature: Feature): boolean {
  return TIER_FEATURES[tier]?.includes(feature) ?? false;
}

export function getRequiredTier(feature: Feature): Tier {
  if (TIER_FEATURES.FREE.includes(feature)) return "FREE";
  if (TIER_FEATURES.PRO.includes(feature)) return "PRO";
  return "ADVANCED";
}

export const TIER_COLORS: Record<Tier, string> = {
  FREE:     "bg-gray-100 text-gray-700",
  PRO:      "bg-blue-100 text-blue-700",
  ADVANCED: "bg-purple-100 text-purple-700",
};

export const TIER_LABELS: Record<Tier, string> = {
  FREE:     "Free Trial",
  PRO:      "Pro",
  ADVANCED: "Advanced",
};

/**
 * Returns true if the user's trial has expired and they have no active subscription.
 * On FREE tier with expired trial → block access to everything.
 */
export function isTrialExpired(tier: Tier, trialEndsAt?: string | null, stripeStatus?: string | null): boolean {
  if (tier !== "FREE") return false;
  if (stripeStatus === "active" || stripeStatus === "trialing") return false;
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt).getTime() < Date.now();
}

/**
 * Days remaining in trial. Returns 0 if expired or not on trial.
 */
export function trialDaysLeft(trialEndsAt?: string | null): number {
  if (!trialEndsAt) return 0;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function getStripePriceIds(): Record<"PRO" | "ADVANCED", string> {
  return {
    PRO:      process.env.STRIPE_PRICE_PRO      ?? "",
    ADVANCED: process.env.STRIPE_PRICE_ADVANCED ?? "",
  };
}

// Keep a named export for backwards compat — accessed at runtime, not module init
export const STRIPE_PRICE_IDS: Record<"PRO" | "ADVANCED", string> = {
  get PRO()      { return process.env.STRIPE_PRICE_PRO      ?? ""; },
  get ADVANCED() { return process.env.STRIPE_PRICE_ADVANCED ?? ""; },
};

export const PLAN_PRICES: Record<"PRO" | "ADVANCED", string> = {
  PRO:      "$29/mo",
  ADVANCED: "$59/mo",
};
