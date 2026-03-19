import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AnnouncementsClient } from "./announcements-client";

export default async function AnnouncementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as any;

  // Fetch unique branches and departments for targeting dropdowns
  const employees = await prisma.employee.findMany({
    select: { branchLocation: true, department: true },
  });

  const branches = Array.from(
    new Set(employees.map((e) => e.branchLocation).filter((v): v is string => Boolean(v))),
  ).sort();

  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter((v): v is string => Boolean(v))),
  ).sort();

  return (
    <DashboardLayout title="Announcements">
      <AnnouncementsClient
        userRole={user.role}
        branches={branches}
        departments={departments}
      />
    </DashboardLayout>
  );
}
