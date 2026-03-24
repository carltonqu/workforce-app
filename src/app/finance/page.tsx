import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrismaForOrg } from "@/lib/tenant";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FinanceClient } from "./finance-client";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { hasFeatureAccess, type Tier } from "@/lib/tier";

export default async function FinancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as { id?: string; role?: string; orgId?: string; tier?: string };
  if (user?.role !== "MANAGER" && user?.role !== "HR") redirect("/dashboard");

  const tier = (user.tier ?? "FREE") as Tier;
  if (!hasFeatureAccess(tier, "finance")) {
    return (
      <DashboardLayout title="Finance Summary">
        <UpgradePrompt requiredTier="ADVANCED" featureName="Finance Reports" />
      </DashboardLayout>
    );
  }

  const prisma = await getPrismaForOrg(user.orgId ?? "");

  // Fetch all payroll entries from TENANT DB
  const payrollEntries = await prisma.payrollEntry.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { periodStart: "desc" },
  });

  // Fetch all employees from TENANT DB
  const employees = await (prisma as any).employee.findMany({
    orderBy: { department: "asc" },
  });

  return (
    <DashboardLayout title="Finance Summary">
      <FinanceClient
        payrollEntries={payrollEntries as never}
        employees={employees as never}
      />
    </DashboardLayout>
  );
}
