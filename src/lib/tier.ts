export type Tier = "FREE" | "PRO" | "ADVANCED";
export type Feature =
  | "time-tracking"
  | "scheduling"
  | "payroll"
  | "reports"
  | "notifications"
  | "role-based-access";

const TIER_FEATURES: Record<Tier, Feature[]> = {
  FREE: ["time-tracking", "role-based-access"],
  PRO: ["time-tracking", "role-based-access", "scheduling", "notifications"],
  ADVANCED: [
    "time-tracking",
    "role-based-access",
    "scheduling",
    "notifications",
    "payroll",
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
  FREE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  PRO: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  ADVANCED:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

export const TIER_LABELS: Record<Tier, string> = {
  FREE: "Free",
  PRO: "Pro",
  ADVANCED: "Advanced",
};
