import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg } from "@/lib/tenant";
import { requireFeature } from "@/lib/api-guard";
import type { PayrollBreakdown, PayrollInput } from "@/lib/payroll-engine";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id: string; role: string; orgId?: string };
  if (user.role !== "MANAGER" && user.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const planGuard = await requireFeature("payroll");
  if (planGuard) return planGuard;
  const prisma = await getPrismaForOrg(user.orgId ?? "");

  const body = await req.json() as {
    userId: string;
    periodType: string;
    periodStart: string;
    periodEnd: string;
    rateType: string;
    rate: number;
    breakdown: PayrollBreakdown;
    input: PayrollInput;
    notes?: string;
  };

  const { userId, periodType, periodStart, periodEnd, rateType, rate, breakdown, notes } = body;

  if (!userId || !periodStart || !periodEnd || !breakdown) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const entry = await prisma.payrollEntry.create({
    data: {
      employeeId: userId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      periodType: periodType ?? "MONTHLY",
      status: "DRAFT",
      rateType: rateType ?? "MONTHLY",
      rate: rate ?? 0,
      dailyRate: breakdown.dailyRate,
      hourlyRate: breakdown.hourlyRate,
      daysWorked: breakdown.daysWorked,
      hoursWorked: breakdown.hoursWorked,
      lateMinutes: breakdown.lateMinutes,
      undertimeMinutes: breakdown.undertimeMinutes,
      absenceDays: breakdown.absenceDays,
      basicPay: breakdown.basicPay,
      lateDeduction: breakdown.lateDeduction,
      undertimeDeduction: breakdown.undertimeDeduction,
      absenceDeduction: breakdown.absenceDeduction,
      otPay: breakdown.totalOTPay,
      nightDiffPay: breakdown.nightDiffPay,
      holidayPay: breakdown.totalHolidayPay,
      allowancesJson: JSON.stringify(breakdown.allowances),
      totalAllowances: breakdown.totalAllowances,
      grossPay: breakdown.grossPay,
      sssEmployee: breakdown.sssEmployee,
      sssEmployer: breakdown.sssEmployer,
      philhealthEmployee: breakdown.philhealthEmployee,
      philhealthEmployer: breakdown.philhealthEmployer,
      pagibigEmployee: breakdown.pagibigEmployee,
      pagibigEmployer: breakdown.pagibigEmployer,
      withholdingTax: breakdown.withholdingTax,
      taxableIncome: breakdown.taxableIncome,
      otherDeductionsJson: JSON.stringify(breakdown.otherDeductions),
      totalOtherDeductions: breakdown.totalOtherDeductions,
      netPay: breakdown.netPay,
      // Legacy fields
      regularHours: breakdown.hoursWorked,
      overtimeHours: 0,
      payRate: rate ?? 0,
      deductions: breakdown.sssEmployee + breakdown.philhealthEmployee + breakdown.pagibigEmployee + breakdown.withholdingTax + breakdown.totalOtherDeductions,
      total: breakdown.netPay,
      notes: notes ?? null,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
