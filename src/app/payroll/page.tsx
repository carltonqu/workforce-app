import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PayrollClient } from "./payroll-client";
import { hasFeatureAccess, type Tier } from "@/lib/tier";
import { UpgradePrompt } from "@/components/upgrade-prompt";

export default async function PayrollPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string; role: string; tier?: string; orgId?: string };
  const tier = (user.tier ?? "FREE") as Tier;

  if (!hasFeatureAccess(tier, "payroll")) {
    return (
      <DashboardLayout title="Payroll">
        <UpgradePrompt requiredTier="ADVANCED" featureName="Automated Payroll" />
      </DashboardLayout>
    );
  }

  const isAdmin = user.role === "MANAGER" || user.role === "HR";

  // Fetch employees list for admin dropdown
  const employees = isAdmin
    ? await prisma.user.findMany({
        where: user.orgId ? { orgId: user.orgId } : {},
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      })
    : [];

  // Fetch employee profiles for branch/department grouping
  const employeeProfiles = isAdmin
    ? await prisma.employee.findMany({
        select: { email: true, branchLocation: true, department: true, fullName: true },
        orderBy: { fullName: "asc" },
      })
    : [];

  // Fetch payroll entries
  const payrollEntriesRaw = isAdmin
    ? await prisma.payrollEntry.findMany({
        orderBy: { periodEnd: "desc" },
        include: { user: { select: { name: true, email: true } } },
        take: 200,
      })
    : await prisma.payrollEntry.findMany({
        where: { userId: user.id },
        orderBy: { periodEnd: "desc" },
        include: { user: { select: { name: true, email: true } } },
      });

  // Fetch current-year holidays
  const currentYear = new Date().getFullYear();
  const holidaysRaw = await prisma.holiday.findMany({
    where: {
      date: {
        gte: new Date(`${currentYear}-01-01`),
        lte: new Date(`${currentYear}-12-31`),
      },
    },
    orderBy: { date: "asc" },
  });

  const payrollEntries = payrollEntriesRaw.map((p) => ({
    ...p,
    periodStart: p.periodStart.toISOString(),
    periodEnd: p.periodEnd.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const holidays = holidaysRaw.map((h) => ({
    ...h,
    date: h.date.toISOString(),
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
  }));

  return (
    <DashboardLayout title="Payroll">
      <PayrollClient
        employees={employees}
        payrollEntries={payrollEntries}
        holidays={holidays}
        employeeProfiles={employeeProfiles}
        currentUserId={user.id}
        userRole={user.role}
      />
    </DashboardLayout>
  );
}
