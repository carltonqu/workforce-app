import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AnnouncementsClient } from "./announcements-client";

export default async function AnnouncementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as any;
  return (
    <DashboardLayout title="Announcements">
      <AnnouncementsClient userRole={user.role} />
    </DashboardLayout>
  );
}
