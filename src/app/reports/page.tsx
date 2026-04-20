import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ReportsClient } from "./reports-client";
import { hasFeatureAccess } from "@/lib/tier";
import { UpgradePrompt } from "@/components/upgrade-prompt";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as any;
  const tier = user.tier || "FREE";
  const isAdmin = user.role === "MANAGER" || user.role === "HR";

  if (isAdmin && !hasFeatureAccess(tier, "reports")) {
    return (
      <DashboardLayout title="Reports">
        <UpgradePrompt requiredTier="ADVANCED" featureName="Analytics & Reports" />
      </DashboardLayout>
    );
  }

  // Fetch last 30 days of data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [timeEntries, payrollEntries] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        employeeId: user.id,
        clockIn: { gte: thirtyDaysAgo },
        clockOut: { not: null },
      },
      orderBy: { clockIn: "asc" },
    }),
    prisma.payrollEntry.findMany({
      where: { employeeId: user.id },
      orderBy: { periodEnd: "desc" },
      take: 6,
    }),
  ]);

  // Build attendance data by day
  const attendanceMap = new Map<string, { hours: number; overtime: number }>();
  timeEntries.forEach((entry) => {
    const day = entry.clockIn.toISOString().slice(0, 10);
    const hours = entry.clockOut
      ? (entry.clockOut.getTime() - entry.clockIn.getTime()) / 3600000
      : 0;
    const existing = attendanceMap.get(day) || { hours: 0, overtime: 0 };
    attendanceMap.set(day, {
      hours: existing.hours + hours,
      overtime: existing.overtime + entry.overtimeMinutes / 60,
    });
  });

  const attendanceData = Array.from(attendanceMap.entries()).map(([date, v]) => ({
    date,
    hours: Math.round(v.hours * 10) / 10,
    overtime: Math.round(v.overtime * 10) / 10,
  }));

  const laborCostData = payrollEntries.map((p) => ({
    period: `${new Date(p.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(p.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    regular: Math.round(p.regularHours * p.payRate),
    overtime: Math.round(p.overtimeHours * p.payRate * 1.5),
    total: Math.round(p.total),
  })).reverse();

  return (
    <DashboardLayout title="Reports & Analytics">
      <ReportsClient
        attendanceData={attendanceData}
        laborCostData={laborCostData}
      />
    </DashboardLayout>
  );
}
