import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TimeTrackingClient } from "./time-tracking-client";

export default async function TimeTrackingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as any;

  const [activeEntry, recentEntries] = await Promise.all([
    prisma.timeEntry.findFirst({
      where: { employeeId: user.id, clockOut: null },
    }),
    prisma.timeEntry.findMany({
      where: { employeeId: user.id, clockOut: { not: null } },
      orderBy: { clockIn: "desc" },
      take: 10,
    }),
  ]);

  return (
    <DashboardLayout title="Time Tracking">
      <TimeTrackingClient
        userId={user.id}
        activeEntry={activeEntry ? {
          ...activeEntry,
          clockIn: activeEntry.clockIn.toISOString(),
          clockOut: activeEntry.clockOut?.toISOString() ?? null,
        } : null}
        recentEntries={recentEntries.map((e) => ({
          ...e,
          clockIn: e.clockIn.toISOString(),
          clockOut: e.clockOut?.toISOString() ?? null,
        }))}
      />
    </DashboardLayout>
  );
}
