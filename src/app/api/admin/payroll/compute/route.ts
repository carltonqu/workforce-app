import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg } from "@/lib/tenant";
import { requireFeature } from "@/lib/api-guard";
import { computePayroll, type PayrollInput } from "@/lib/payroll-engine";

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
    periodType: "WEEKLY" | "SEMI_MONTHLY" | "MONTHLY";
    periodStart: string;
    periodEnd: string;
    // Optional attendance overrides
    daysWorked?: number;
    hoursWorked?: number;
    lateMinutes?: number;
    undertimeMinutes?: number;
    absenceDays?: number;
    regularOTHours?: number;
    restDayOTHours?: number;
    regularHolidayOTHours?: number;
    specialHolidayOTHours?: number;
    restDayRegularHolidayOTHours?: number;
    restDaySpecialHolidayOTHours?: number;
    nightDiffHours?: number;
    regularHolidayWorkedHours?: number;
    specialHolidayWorkedHours?: number;
    regularHolidayRestDayWorkedHours?: number;
    specialHolidayRestDayWorkedHours?: number;
    regularHolidaysNotWorked?: number;
    allowances?: { name: string; amount: number; perDay?: boolean }[];
    otherDeductions?: { name: string; amount: number }[];
  };

  const { userId, periodType, periodStart, periodEnd } = body;
  if (!userId || !periodType || !periodStart || !periodEnd) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const periodStartDate = new Date(periodStart);
  const periodEndDate = new Date(periodEnd);

  // Try to find employee by userId via User email match
  const userRecord = await prisma.user.findUnique({ where: { id: userId } });
  if (!userRecord) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const employeeRecord = await prisma.employee.findFirst({
    where: { email: userRecord.email },
  });

  if (!employeeRecord || !employeeRecord.salaryRate) {
    return NextResponse.json(
      { error: "Employee profile not configured or salary not set", missingProfile: true },
      { status: 422 }
    );
  }

  const salaryRate = employeeRecord.salaryRate;
  const payrollType = employeeRecord.payrollType?.toUpperCase() ?? "MONTHLY";
  const rateType: "MONTHLY" | "DAILY" | "HOURLY" =
    payrollType === "DAILY" ? "DAILY" : payrollType === "HOURLY" ? "HOURLY" : "MONTHLY";

  // Auto-compute attendance from time entries if overrides not provided
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      userId,
      clockIn: { gte: periodStartDate, lte: periodEndDate },
      clockOut: { not: null },
    },
  });

  // Compute days worked from unique dates
  const uniqueDates = new Set(
    timeEntries.map((t) => t.clockIn.toISOString().split("T")[0])
  );
  const autoDaysWorked = uniqueDates.size;

  const autoHoursWorked = timeEntries.reduce((acc, t) => {
    if (!t.clockOut) return acc;
    return acc + (t.clockOut.getTime() - t.clockIn.getTime()) / 3600000;
  }, 0);

  // Fetch holidays in this period
  const holidays = await prisma.holiday.findMany({
    where: {
      date: { gte: periodStartDate, lte: periodEndDate },
    },
  });
  const regularHolidaysNotWorked = holidays.filter(
    (h) => h.type === "Regular"
  ).length;

  const input: PayrollInput = {
    rateType,
    rate: salaryRate,
    periodType: periodType as "WEEKLY" | "SEMI_MONTHLY" | "MONTHLY",
    periodStart: periodStartDate,
    periodEnd: periodEndDate,
    daysWorked: body.daysWorked ?? autoDaysWorked,
    hoursWorked: body.hoursWorked ?? Math.round(autoHoursWorked * 10) / 10,
    lateMinutes: body.lateMinutes ?? 0,
    undertimeMinutes: body.undertimeMinutes ?? 0,
    absenceDays: body.absenceDays ?? 0,
    regularOTHours: body.regularOTHours ?? 0,
    restDayOTHours: body.restDayOTHours ?? 0,
    regularHolidayOTHours: body.regularHolidayOTHours ?? 0,
    specialHolidayOTHours: body.specialHolidayOTHours ?? 0,
    restDayRegularHolidayOTHours: body.restDayRegularHolidayOTHours ?? 0,
    restDaySpecialHolidayOTHours: body.restDaySpecialHolidayOTHours ?? 0,
    nightDiffHours: body.nightDiffHours ?? 0,
    regularHolidayWorkedHours: body.regularHolidayWorkedHours ?? 0,
    specialHolidayWorkedHours: body.specialHolidayWorkedHours ?? 0,
    regularHolidayRestDayWorkedHours: body.regularHolidayRestDayWorkedHours ?? 0,
    specialHolidayRestDayWorkedHours: body.specialHolidayRestDayWorkedHours ?? 0,
    regularHolidaysNotWorked: body.regularHolidaysNotWorked ?? regularHolidaysNotWorked,
    allowances: body.allowances ?? [],
    otherDeductions: body.otherDeductions ?? [],
  };

  const breakdown = computePayroll(input);

  return NextResponse.json({
    employee: {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      rateType,
      rate: salaryRate,
    },
    input,
    breakdown,
  });
}
