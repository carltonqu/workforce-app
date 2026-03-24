import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AssetsClient } from "./assets-client";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { hasFeatureAccess, type Tier } from "@/lib/tier";

export default async function AssetsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as any;
  const isAdmin = user.role === "MANAGER" || user.role === "HR";
  if (!isAdmin && !user.isSupervisor) redirect("/employee-dashboard");

  const tier = (user.tier ?? "FREE") as Tier;
  if (isAdmin && !hasFeatureAccess(tier, "assets")) {
    return (
      <DashboardLayout title="Assets">
        <UpgradePrompt requiredTier="PRO" featureName="Asset Management" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Assets">
      <AssetsClient user={user} />
    </DashboardLayout>
  );
}
