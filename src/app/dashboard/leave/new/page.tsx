import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { NewLeaveClient } from "./new-leave-client";

export default async function NewLeavePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR" && !user.isSupervisor) redirect("/dashboard");
  
  return (
    <DashboardLayout title="Add Leave Request">
      <NewLeaveClient />
    </DashboardLayout>
  );
}
