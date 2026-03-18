import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PerformanceClient } from "./performance-client";

export default async function PerformancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") redirect("/dashboard");
  return (
    <DashboardLayout title="Employee Performance">
      <PerformanceClient user={user} />
    </DashboardLayout>
  );
}
