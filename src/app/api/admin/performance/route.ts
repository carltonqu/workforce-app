import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTenantDb } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR" && !(user as any).isSupervisor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = await getTenantDb(user.orgId);
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = searchParams.get("to") || new Date().toISOString().slice(0, 10);

  // Get all shifts in range
  const shiftsRes = await db.execute({
    sql: `SELECT es.userId, es.date, es.shiftStart, es.shiftEnd,
          COALESCE(e.fullName, u.name) as employeeName,
          COALESCE(e.department, '') as department
          FROM EmployeeShift es
          JOIN User u ON es.userId = u.id
          LEFT JOIN Employee e ON u.linkedEmployeeId = e.id
          WHERE es.date >= ? AND es.date <= ? AND es.isRestDay = 0
          ORDER BY es.userId, es.date`,
    args: [from, to],
  });

  // Get all time entries in range
  const entriesRes = await db.execute({
    sql: `SELECT userId, DATE(clockIn) as date, clockIn, clockOut
          FROM TimeEntry
          WHERE DATE(clockIn) >= ? AND DATE(clockIn) <= ?
          ORDER BY userId, clockIn`,
    args: [from, to],
  });

  // Group entries by userId+date
  const entryMap = new Map<string, { clockIn: string; clockOut: string | null }>();
  for (const row of entriesRes.rows as any[]) {
    const key = `${row.userId}__${row.date}`;
    if (!entryMap.has(key)) entryMap.set(key, { clockIn: row.clockIn, clockOut: row.clockOut });
  }

  // Per-employee stats
  const employeeStats = new Map<string, {
    employeeName: string;
    department: string;
    userId: string;
    totalShifts: number;
    present: number;
    absent: number;
    lateCount: number;
    earlyCount: number;
    undertimeCount: number;
    totalEarlyMinutes: number;
    totalLateMinutes: number;
    performanceScore: number;
    grade: string;
  }>();

  for (const shift of shiftsRes.rows as any[]) {
    const key = `${shift.userId}__${shift.date}`;
    const entry = entryMap.get(key);
    const empKey = shift.userId as string;

    if (!employeeStats.has(empKey)) {
      employeeStats.set(empKey, {
        employeeName: shift.employeeName,
        department: shift.department,
        userId: shift.userId,
        totalShifts: 0,
        present: 0,
        absent: 0,
        lateCount: 0,
        earlyCount: 0,
        undertimeCount: 0,
        totalEarlyMinutes: 0,
        totalLateMinutes: 0,
        performanceScore: 0,
        grade: "N/A",
      });
    }
    const stat = employeeStats.get(empKey)!;
    stat.totalShifts++;

    if (!entry) {
      stat.absent++;
      continue;
    }

    stat.present++;

    // Calculate lateness
    const shiftStartDt = new Date(`${shift.date}T${shift.shiftStart}`);
    const actualIn = new Date(entry.clockIn);
    const diffMinutes = Math.round((actualIn.getTime() - shiftStartDt.getTime()) / 60000);

    if (diffMinutes <= -10) {
      stat.earlyCount++;
      stat.totalEarlyMinutes += Math.abs(diffMinutes);
    } else if (diffMinutes > 0) {
      stat.lateCount++;
      stat.totalLateMinutes += diffMinutes;
    }

    // Check undertime
    if (entry.clockOut) {
      const workedMinutes = Math.round((new Date(entry.clockOut).getTime() - actualIn.getTime()) / 60000);
      if (workedMinutes < 8 * 60 - 15) {
        stat.undertimeCount++;
      }
    }
  }

  // Calculate performance scores
  const result = Array.from(employeeStats.values()).map((stat) => {
    if (stat.totalShifts === 0) return { ...stat, performanceScore: 0, grade: "N/A", avgEarlyMins: 0, avgLateMins: 0 };

    const attendanceRate = stat.present / stat.totalShifts;
    const earlyRate = stat.totalShifts > 0 ? stat.earlyCount / stat.totalShifts : 0;
    const lateRate = stat.lateCount / stat.totalShifts;
    const undertimeRate = stat.undertimeCount / stat.totalShifts;

    let score = 0;
    score += attendanceRate * 40;
    score += earlyRate * 25;
    score += (1 - lateRate) * 20;
    score += (1 - undertimeRate) * 15;

    score = Math.min(100, Math.max(0, Math.round(score)));

    let grade = "Poor";
    if (score >= 95) grade = "Excellent";
    else if (score >= 85) grade = "Very Good";
    else if (score >= 75) grade = "Good";
    else if (score >= 60) grade = "Fair";

    const avgEarlyMins = stat.earlyCount > 0 ? Math.round(stat.totalEarlyMinutes / stat.earlyCount) : 0;
    const avgLateMins = stat.lateCount > 0 ? Math.round(stat.totalLateMinutes / stat.lateCount) : 0;

    return { ...stat, performanceScore: score, grade, avgEarlyMins, avgLateMins };
  });

  return NextResponse.json(result.sort((a, b) => b.performanceScore - a.performanceScore));
}
