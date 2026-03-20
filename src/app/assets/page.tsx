import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AssetsClient } from "./assets-client";

export default async function AssetsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") redirect("/employee-dashboard");
  return (
    <DashboardLayout title="Assets">
      <AssetsClient user={user} />
    </DashboardLayout>
  );
}
