import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrismaForOrg } from "@/lib/tenant";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PayrollClient } from "./payroll-client";
import { hasFeatureAccess, type Tier } from "@/lib/tier";
import { UpgradePrompt } from "@/components/upgrade-prompt";

export default async function PayrollPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string; role: string; tier?: string; orgId?: string };
  const tier = (user.tier ?? "FREE") as Tier;
  const isAdminUser = user.role === "MANAGER" || user.role === "HR";

  if (isAdminUser && !hasFeatureAccess(tier, "payroll")) {
    return (
      <DashboardLayout title="Payroll">
        <UpgradePrompt requiredTier="ADVANCED" featureName="Automated Payroll" />
      </DashboardLayout>
    );
  }

  const prisma = await getPrismaForOrg(user.orgId ?? "");
  const isAdmin = user.role === "MANAGER" || user.role === "HR";

  // Fetch User accounts (have login + can process payroll)
  const userAccounts = isAdmin
    ? await prisma.user.findMany({
        where: user.orgId ? { orgId: user.orgId } : {},
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      })
    : [];

  // Fetch ALL Employee profiles (includes those without user accounts)
  const employeeProfiles = isAdmin
    ? await (prisma as any).employee.findMany({
        select: {
          email: true,
          branchLocation: true,
          department: true,
          fullName: true,
          employmentStatus: true,
          salaryRate: true,
          payrollType: true,
        },
        orderBy: { fullName: "asc" },
      })
    : [];

  const userEmailSet = new Set(userAccounts.map((u) => u.email));

  const employeesWithoutAccount = employeeProfiles
    .filter((ep: any) => ep.employmentStatus !== "Terminated" && !userEmailSet.has(ep.email))
    .map((ep: any) => ({
      id: "",
      name: ep.fullName,
      email: ep.email,
      role: "EMPLOYEE",
      hasNoAccount: true,
    }));

  const employees = [
    ...userAccounts.map((u) => ({ ...u, hasNoAccount: false })),
    ...employeesWithoutAccount,
  ];

  // Fetch payroll entries — from TENANT DB
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

  // Fetch holidays — from TENANT DB
  const currentYear = new Date().getFullYear();
  const holidaysRaw = await (prisma as any).holiday.findMany({
    where: {
      date: {
        gte: new Date(`${currentYear}-01-01`),
        lte: new Date(`${currentYear}-12-31`),
      },
    },
    orderBy: { date: "asc" },
  });

  const payrollEntries = payrollEntriesRaw.map((p: any) => ({
    id: p.id,
    userId: p.userId,
    periodStart: p.periodStart instanceof Date ? p.periodStart.toISOString() : String(p.periodStart),
    periodEnd: p.periodEnd instanceof Date ? p.periodEnd.toISOString() : String(p.periodEnd),
    periodType: p.periodType,
    status: p.status,
    rateType: p.rateType,
    rate: p.rate,
    dailyRate: p.dailyRate,
    hourlyRate: p.hourlyRate,
    daysWorked: p.daysWorked,
    hoursWorked: p.hoursWorked,
    lateMinutes: p.lateMinutes,
    undertimeMinutes: p.undertimeMinutes,
    absenceDays: p.absenceDays,
    basicPay: p.basicPay,
    lateDeduction: p.lateDeduction,
    undertimeDeduction: p.undertimeDeduction,
    absenceDeduction: p.absenceDeduction,
    otPay: p.otPay,
    nightDiffPay: p.nightDiffPay,
    holidayPay: p.holidayPay,
    allowancesJson: p.allowancesJson,
    totalAllowances: p.totalAllowances,
    grossPay: p.grossPay,
    sssEmployee: p.sssEmployee,
    sssEmployer: p.sssEmployer,
    philhealthEmployee: p.philhealthEmployee,
    philhealthEmployer: p.philhealthEmployer,
    pagibigEmployee: p.pagibigEmployee,
    pagibigEmployer: p.pagibigEmployer,
    withholdingTax: p.withholdingTax,
    taxableIncome: p.taxableIncome,
    otherDeductionsJson: p.otherDeductionsJson,
    totalOtherDeductions: p.totalOtherDeductions,
    netPay: p.netPay,
    regularHours: p.regularHours,
    overtimeHours: p.overtimeHours,
    payRate: p.payRate,
    deductions: p.deductions,
    total: p.total,
    notes: p.notes ?? null,
    user: p.user ?? null,
  }));

  const holidays = holidaysRaw.map((h: any) => ({
    id: h.id,
    name: h.name,
    type: h.type,
    orgId: h.orgId ?? null,
    date: h.date instanceof Date ? h.date.toISOString() : String(h.date),
  }));

  const safeEmployeeProfiles = employeeProfiles.map((ep: any) => ({
    email: ep.email,
    branchLocation: ep.branchLocation ?? null,
    department: ep.department ?? null,
    fullName: ep.fullName,
  }));

  return (
    <DashboardLayout title="Payroll">
      <PayrollClient
        employees={employees}
        payrollEntries={payrollEntries}
        holidays={holidays}
        employeeProfiles={safeEmployeeProfiles}
        currentUserId={user.id}
        userRole={user.role}
      />
    </DashboardLayout>
  );
}
