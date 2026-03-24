import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SettingsClient } from "./settings-client";
import { isTrialExpired } from "@/lib/tier";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ trial_expired?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as any;
  const params = await searchParams;

  const [fullUser, org] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true, tier: true, orgId: true },
    }),
    user.orgId
      ? prisma.organization.findUnique({
          where: { id: user.orgId },
          select: { id: true, name: true, tier: true, stripeCustomerId: true, stripeStatus: true, trialEndsAt: true },
        })
      : null,
  ]);

  if (!fullUser) redirect("/login");

  const trialExpired =
    params.trial_expired === "1" ||
    isTrialExpired(
      (fullUser.tier ?? "FREE") as any,
      org?.trialEndsAt?.toISOString() ?? null,
      org?.stripeStatus ?? null
    );

  const safeOrg = org
    ? {
        ...org,
        trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
      }
    : null;

  return (
    <DashboardLayout title="Settings">
      <SettingsClient
        user={{ ...fullUser, trialEndsAt: org?.trialEndsAt?.toISOString() ?? null, stripeStatus: org?.stripeStatus ?? null }}
        org={safeOrg}
        trialExpired={trialExpired}
      />
    </DashboardLayout>
  );
}
