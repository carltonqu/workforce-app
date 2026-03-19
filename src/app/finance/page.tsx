import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FinanceClient } from "./finance-client";

export default async function FinancePage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session?.user || (user?.role !== "MANAGER" && user?.role !== "HR")) {
    redirect("/dashboard");
  }

  // Fetch all payroll entries with user info
  const payrollEntries = await prisma.payrollEntry.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { periodStart: "desc" },
  });

  // Fetch all employees for department/branch grouping
  const employees = await prisma.employee.findMany({
    orderBy: { department: "asc" },
  });

  return (
    <FinanceClient
      payrollEntries={payrollEntries as never}
      employees={employees as never}
    />
  );
}
