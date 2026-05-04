import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrismaForOrg } from "@/lib/tenant";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { NewAnnouncementClient } from "./new-announcement-client";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { hasFeatureAccess, type Tier } from "@/lib/tier";

export default async function NewAnnouncementPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as any;
  const tier = (user.tier ?? "FREE") as Tier;
  const isAdmin = user.role === "MANAGER" || user.role === "HR";

  if (isAdmin && !hasFeatureAccess(tier, "announcements")) {
    return (
      <DashboardLayout title="New Announcement">
        <UpgradePrompt requiredTier="PRO" featureName="Announcements" />
      </DashboardLayout>
    );
  }

  const prisma = await getPrismaForOrg(user.orgId ?? "");
  const employees = await (prisma as any).employee.findMany({
    select: { branchLocation: true, department: true },
  });

  const branches = Array.from(
    new Set(employees.map((e: any) => e.branchLocation).filter((v: any): v is string => Boolean(v))),
  ).sort() as string[];

  const departments = Array.from(
    new Set(employees.map((e: any) => e.department).filter((v: any): v is string => Boolean(v))),
  ).sort() as string[];

  return (
    <DashboardLayout title="New Announcement">
      <NewAnnouncementClient
        userRole={user.role}
        branches={branches}
        departments={departments}
      />
    </DashboardLayout>
  );
}
