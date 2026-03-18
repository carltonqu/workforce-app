import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProfileClient } from "./profile-client";

export default async function MyProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as any;
  if (user.role === "MANAGER" || user.role === "HR") redirect("/dashboard");
  return (
    <DashboardLayout title="My Profile">
      <ProfileClient user={user} />
    </DashboardLayout>
  );
}
