import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DashboardClient } from "./dashboard-client";
import { AdminDashboardClient } from "./admin-dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  const user = session.user;
  const isAdmin = user.role === "MANAGER" || user.role === "HR";

  if (user.role === "EMPLOYEE") {
    // For now, employees also see admin dashboard or redirect to employee dashboard
    redirect("/employee-dashboard");
  }

  if (isAdmin) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <AdminDashboardClient user={user} />
      </DashboardLayout>
    );
  }

  // Employee dashboard
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [timeEntries, notifications, payrollEntries] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { userId: user.id, clockIn: { gte: startOfMonth } },
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

  const totalMinutes = timeEntries.reduce((acc, entry) => {
    if (entry.clockOut)
      return acc + Math.floor((entry.clockOut.getTime() - entry.clockIn.getTime()) / 60000);
    return acc;
  }, 0);

  const activeEntry = await prisma.timeEntry.findFirst({
    where: { userId: user.id, clockOut: null },
  });

  const stats = {
    totalHours: Math.floor(totalMinutes / 60),
    overtimeHours:
      Math.round(
        (timeEntries.reduce((acc, e) => acc + e.overtimeMinutes, 0) / 60) * 10
      ) / 10,
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
