import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AttendanceClient } from "./attendance-client";

export default async function MyAttendancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as any;
  if (user.role === "MANAGER" || user.role === "HR") redirect("/dashboard");
  return (
    <DashboardLayout title="My Attendance">
      <AttendanceClient />
    </DashboardLayout>
  );
}
