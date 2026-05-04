import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrismaForOrg } from "@/lib/tenant";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { NewShiftClient } from "./new-shift-client";

export default async function NewShiftPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as any;
  const isAdmin = user.role === "MANAGER" || user.role === "HR";
  if (!isAdmin && !user.isSupervisor) redirect("/dashboard");

  const prisma = await getPrismaForOrg(user.orgId ?? "");

  // Get org employees from Employee table
  const employees = user.orgId
    ? await (prisma as any).employee.findMany({
        where: { orgId: user.orgId, employmentStatus: "Active" },
        select: { id: true, fullName: true, department: true, branchLocation: true },
      })
    : [];

  const departments = Array.from(new Set(employees.map((e: any) => e.department).filter(Boolean))) as string[];
  const branches = Array.from(new Set(employees.map((e: any) => e.branchLocation).filter(Boolean))) as string[];

  return (
    <DashboardLayout title="Add New Shift">
      <NewShiftClient
        employees={employees.map((e: any) => ({ 
          id: e.id, 
          fullName: e.fullName, 
          department: e.department,
          branchLocation: e.branchLocation 
        }))}
        departments={departments}
        branches={branches}
      />
    </DashboardLayout>
  );
}
