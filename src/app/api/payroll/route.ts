import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  if (user.role === "EMPLOYEE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();

  const entry = await prisma.payrollEntry.create({
    data: {
      userId: data.userId,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      regularHours: data.regularHours,
      overtimeHours: data.overtimeHours,
      payRate: data.payRate,
      deductions: data.deductions,
      total: data.total,
    },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  // Send notification to employee
  await prisma.notification.create({
    data: {
      userId: data.userId,
      type: "PAYROLL_READY",
      message: `Your payroll for ${new Date(data.periodStart).toLocaleDateString()} - ${new Date(data.periodEnd).toLocaleDateString()} is ready. Total: $${data.total.toFixed(2)}`,
    },
  });

  return NextResponse.json(entry);
}
