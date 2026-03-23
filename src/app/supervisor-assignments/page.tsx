import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SupervisorAssignmentsClient } from "./supervisor-assignments-client";

export default async function SupervisorAssignmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") {
    redirect("/dashboard");
  }

  return (
    <DashboardLayout>
      <SupervisorAssignmentsClient />
    </DashboardLayout>
  );
}
