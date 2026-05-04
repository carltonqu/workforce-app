import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AdminDashboardClient } from "./admin-dashboard-client";

export default async function AdminDashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  // Only ADMIN (MANAGER/HR) can access this page
  if (user.role !== "MANAGER" && user.role !== "HR") {
    redirect("/dashboard");
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      <AdminDashboardClient user={user} />
    </DashboardLayout>
  );
}
