import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmployeeDashboardClient } from "./employee-dashboard-client";

export default async function EmployeeDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as any;
  if (user.role === "MANAGER" || user.role === "HR") redirect("/dashboard");
  return (
    <DashboardLayout title="My Dashboard">
      <EmployeeDashboardClient user={user} />
    </DashboardLayout>
  );
}
