import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PayrollClient } from "./payroll-client";
import { hasFeatureAccess } from "@/lib/tier";
import { UpgradePrompt } from "@/components/upgrade-prompt";

export default async function PayrollPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as any;
  const tier = user.tier || "FREE";

  if (!hasFeatureAccess(tier, "payroll")) {
    return (
      <DashboardLayout title="Payroll">
        <UpgradePrompt requiredTier="ADVANCED" featureName="Automated Payroll" />
      </DashboardLayout>
    );
  }

  // Fetch payroll entries + time entries for auto-calculation
  const [payrollEntries, timeEntries] = await Promise.all([
    prisma.payrollEntry.findMany({
      where: { userId: user.id },
      orderBy: { periodEnd: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.timeEntry.findMany({
      where: {
        userId: user.id,
        clockOut: { not: null },
      },
      orderBy: { clockIn: "desc" },
    }),
  ]);

  // Get all org employees if manager/HR
  const orgEmployees =
    (user.role === "MANAGER" || user.role === "HR") && user.orgId
      ? await prisma.user.findMany({
          where: { orgId: user.orgId },
          select: { id: true, name: true, email: true, role: true },
        })
      : [];

  return (
    <DashboardLayout title="Payroll">
      <PayrollClient
        payrollEntries={payrollEntries.map((p) => ({
          ...p,
          periodStart: p.periodStart.toISOString(),
          periodEnd: p.periodEnd.toISOString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }))}
        timeEntries={timeEntries.map((t) => ({
          ...t,
          clockIn: t.clockIn.toISOString(),
          clockOut: t.clockOut?.toISOString() ?? null,
        }))}
        currentUserId={user.id}
        orgEmployees={orgEmployees}
        userRole={user.role}
      />
    </DashboardLayout>
  );
}
