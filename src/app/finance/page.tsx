import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrismaForOrg } from "@/lib/tenant";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FinanceClient } from "./finance-client";

export default async function FinancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = session.user as { id?: string; role?: string; orgId?: string };
  if (user?.role !== "MANAGER" && user?.role !== "HR") redirect("/dashboard");

  const prisma = await getPrismaForOrg(user.orgId ?? "");

  // Fetch all payroll entries from TENANT DB
  const payrollEntries = await prisma.payrollEntry.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { periodStart: "desc" },
  });

  // Fetch all employees from TENANT DB
  const employees = await (prisma as any).employee.findMany({
    orderBy: { department: "asc" },
  });

  return (
    <DashboardLayout title="Finance Summary">
      <FinanceClient
        payrollEntries={payrollEntries as never}
        employees={employees as never}
      />
    </DashboardLayout>
  );
}
