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

  const org = user.orgId
    ? await prisma.organization.findUnique({
        where: { id: user.orgId },
        select: { id: true, name: true, tier: true, stripeCustomerId: true, stripeStatus: true, trialEndsAt: true },
      })
    : null;

  const trialEndsAtStr = org?.trialEndsAt ? String(org.trialEndsAt) : null;

  const trialExpired =
    params.trial_expired === "1" ||
    isTrialExpired(
      (user.tier ?? "FREE") as any,
      trialEndsAtStr,
      org?.stripeStatus ?? null
    );

  const safeOrg = org
    ? {
        ...org,
        trialEndsAt: trialEndsAtStr,
      }
    : null;

  return (
    <DashboardLayout title="Settings">
      <SettingsClient
        user={{ 
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tier: user.tier,
          orgId: user.orgId,
          trialEndsAt: trialEndsAtStr, 
          stripeStatus: org?.stripeStatus ?? null 
        }}
        org={safeOrg}
        trialExpired={trialExpired}
      />
    </DashboardLayout>
  );
}
