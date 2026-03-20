import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MyAssetsClient } from "./my-assets-client";

export default async function MyAssetsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <DashboardLayout title="My Assets">
      <MyAssetsClient user={session.user} />
    </DashboardLayout>
  );
}
