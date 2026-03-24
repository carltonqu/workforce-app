import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ApprovalsClient } from "./approvals-client";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { hasFeatureAccess, type Tier } from "@/lib/tier";

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") redirect("/dashboard");

  const tier = (user.tier ?? "FREE") as Tier;
  if (!hasFeatureAccess(tier, "approvals")) {
    return (
      <DashboardLayout title="Approvals">
        <UpgradePrompt requiredTier="PRO" featureName="Approval Workflows" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Approvals">
      <ApprovalsClient user={user} />
    </DashboardLayout>
  );
}
