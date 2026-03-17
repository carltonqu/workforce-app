import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as any;

  const [fullUser, org] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true, tier: true, orgId: true },
    }),
    user.orgId
      ? prisma.organization.findUnique({
          where: { id: user.orgId },
          select: { id: true, name: true, tier: true },
        })
      : null,
  ]);

  if (!fullUser) redirect("/login");

  return (
    <DashboardLayout title="Settings">
      <SettingsClient user={fullUser} org={org} />
    </DashboardLayout>
  );
}
