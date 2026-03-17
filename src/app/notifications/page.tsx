import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { NotificationsClient } from "./notifications-client";
import { hasFeatureAccess } from "@/lib/tier";
import { UpgradePrompt } from "@/components/upgrade-prompt";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as any;
  const tier = user.tier || "FREE";

  if (!hasFeatureAccess(tier, "notifications")) {
    return (
      <DashboardLayout title="Notifications">
        <UpgradePrompt requiredTier="PRO" featureName="Smart Notifications" />
      </DashboardLayout>
    );
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <DashboardLayout title="Notifications">
      <NotificationsClient
        notifications={notifications.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </DashboardLayout>
  );
}
