import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LeaveClient } from "./leave-client";

export default async function LeavePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") redirect("/dashboard");
  return (
    <DashboardLayout title="Leave Management">
      <LeaveClient user={user} />
    </DashboardLayout>
  );
}
