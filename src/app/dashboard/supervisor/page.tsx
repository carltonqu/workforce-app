import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SupervisorDashboardClient } from "./supervisor-dashboard-client";

export default async function SupervisorDashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  // Only MANAGER, HR, or SUPERVISOR can access this page
  if (user.role !== "MANAGER" && user.role !== "HR" && user.role !== "SUPERVISOR" && !user.isSupervisor) {
    redirect("/dashboard");
  }

  return (
    <DashboardLayout title="Supervisor Dashboard">
      <SupervisorDashboardClient user={user} />
    </DashboardLayout>
  );
}
