import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrismaForOrg } from "@/lib/tenant";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SchedulingClient } from "./scheduling-client";
import { hasFeatureAccess } from "@/lib/tier";
import { UpgradePrompt } from "@/components/upgrade-prompt";

export default async function SchedulingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as any;
  const isAdmin = user.role === "MANAGER" || user.role === "HR";
  if (!isAdmin && !user.isSupervisor) redirect("/dashboard");

  const tier = user.tier || "FREE";

  if (isAdmin && !hasFeatureAccess(tier, "scheduling")) {
    return (
      <DashboardLayout title="Scheduling">
        <UpgradePrompt requiredTier="PRO" featureName="Drag & Drop Scheduling" />
      </DashboardLayout>
    );
  }

  const prisma = await getPrismaForOrg(user.orgId ?? "");

  // Get current week's schedule
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const schedule = user.orgId
    ? await prisma.schedule.findFirst({
        where: {
          orgId: user.orgId,
          weekStart: { gte: weekStart },
        },
        orderBy: { weekStart: "asc" },
      })
    : null;

  // Get org employees from Employee table
  const employees = user.orgId
    ? await (prisma as any).employee.findMany({
        where: { orgId: user.orgId, employmentStatus: "Active" },
        select: { id: true, fullName: true, department: true },
      })
    : [];

  const shifts = schedule?.shifts ? JSON.parse(schedule.shifts) : [];

  return (
    <DashboardLayout title="Scheduling">
      <SchedulingClient
        initialShifts={shifts}
        employees={employees.map((e: any) => ({ id: e.id, name: e.fullName, role: e.department }))}
        scheduleId={schedule?.id ?? null}
        orgId={user.orgId ?? null}
        weekStart={weekStart.toISOString()}
      />
    </DashboardLayout>
  );
}
