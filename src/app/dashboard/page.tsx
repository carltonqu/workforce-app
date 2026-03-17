import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as any;

  // Fetch stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [timeEntries, notifications, payrollEntries] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        userId: user.id,
        clockIn: { gte: startOfMonth },
      },
      orderBy: { clockIn: "desc" },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId: user.id, read: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.payrollEntry.findMany({
      where: { userId: user.id },
      orderBy: { periodEnd: "desc" },
      take: 1,
    }),
  ]);

  // Calculate total hours this month
  const totalMinutes = timeEntries.reduce((acc, entry) => {
    if (entry.clockOut) {
      return acc + Math.floor((entry.clockOut.getTime() - entry.clockIn.getTime()) / 60000);
    }
    return acc;
  }, 0);

  const totalHours = Math.floor(totalMinutes / 60);
  const overtimeHours = timeEntries.reduce((acc, e) => acc + e.overtimeMinutes, 0) / 60;

  // Check if currently clocked in
  const activeEntry = await prisma.timeEntry.findFirst({
    where: { userId: user.id, clockOut: null },
  });

  const stats = {
    totalHours,
    overtimeHours: Math.round(overtimeHours * 10) / 10,
    unreadNotifications: notifications.length,
    lastPayroll: payrollEntries[0]?.total ?? null,
  };

  return (
    <DashboardLayout title="Dashboard">
      <DashboardClient
        user={user}
        stats={stats}
        recentEntries={timeEntries.map((e) => ({
          ...e,
          clockIn: e.clockIn.toISOString(),
          clockOut: e.clockOut?.toISOString() ?? null,
        }))}
        notifications={notifications.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        }))}
        isCurrentlyClockedIn={!!activeEntry}
      />
    </DashboardLayout>
  );
}
