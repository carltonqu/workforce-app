import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/api-guard";
import { getPrismaForOrg, getTenantDb } from "@/lib/tenant";
import { randomUUID } from "crypto";

// POST: Apply a schedule to all employees in a branch or department
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const planGuard = await requireFeature("scheduling");
  if (planGuard) return planGuard;
  const sessionUser = session.user as { id: string; role: string; orgId?: string };
  if (sessionUser.role !== "MANAGER" && sessionUser.role !== "HR" && !(sessionUser as any).isSupervisor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const prisma = await getPrismaForOrg(sessionUser.orgId ?? "");
  const db = await getTenantDb(sessionUser.orgId ?? "");

  const body = await req.json() as {
    groupType: "branch" | "department";
    groupValue: string;
    dates: string[];
    shiftStart: string;
    shiftEnd: string;
    shiftName?: string;
    location?: string;
    isRestDay?: boolean;
  };

  const { groupType, groupValue, dates, shiftStart, shiftEnd, shiftName, location, isRestDay } = body;

  if (!groupType || !groupValue || !dates?.length || !shiftStart || !shiftEnd) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 1. Find all employees in this group
  const whereClause = groupType === "branch"
    ? { branchLocation: groupValue }
    : { department: groupValue };

  const employees = await (prisma as any).employee.findMany({
    where: whereClause,
    select: { email: true, fullName: true },
  });

  if (employees.length === 0) {
    return NextResponse.json({ error: `No employees found in ${groupType}: ${groupValue}` }, { status: 404 });
  }

  // 2. Find corresponding User records by email
  const emails = employees.map((e: { email: string }) => e.email);
  const users = await (prisma as any).user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true, name: true },
  });

  if (users.length === 0) {
    return NextResponse.json({ error: "No linked user accounts found for these employees" }, { status: 404 });
  }

  // 3. Insert/update EmployeeShift for each user × each date
  // Note: EmployeeShift table has no updatedAt column, so for updates we DELETE + INSERT
  const now = new Date().toISOString();
  let applied = 0;

  for (const user of users) {
    for (const date of dates) {
      // Check if shift exists
      const existing = await db.execute({
        sql: "SELECT id FROM EmployeeShift WHERE userId=? AND date=?",
        args: [user.id, date],
      });

      if (existing.rows.length > 0) {
        // Update existing row (no updatedAt column)
        await db.execute({
          sql: "UPDATE EmployeeShift SET shiftStart=?, shiftEnd=?, shiftName=?, location=?, isRestDay=? WHERE userId=? AND date=?",
          args: [shiftStart, shiftEnd, shiftName || "Regular", location || null, isRestDay ? 1 : 0, user.id, date],
        });
      } else {
        // Insert new
        const id = randomUUID();
        await db.execute({
          sql: "INSERT INTO EmployeeShift (id, userId, date, shiftStart, shiftEnd, shiftName, location, isRestDay, isHoliday, orgId, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
          args: [id, user.id, date, shiftStart, shiftEnd, shiftName || "Regular", location || null, isRestDay ? 1 : 0, 0, sessionUser.orgId || null, now],
        });
      }
      applied++;
    }
  }

  return NextResponse.json({
    success: true,
    applied,
    employeesAffected: users.length,
    datesCount: dates.length,
    message: `Schedule applied to ${users.length} employee(s) across ${dates.length} date(s).`,
  });
}

// GET: List all unique branches and departments that have employees
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const planGuard = await requireFeature("scheduling");
  if (planGuard) return planGuard;
  const sessionUser = session.user as { role: string; orgId?: string };
  if (sessionUser.role !== "MANAGER" && sessionUser.role !== "HR" && !(sessionUser as any).isSupervisor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const prisma = await getPrismaForOrg(sessionUser.orgId ?? "");

  const employees = await (prisma as any).employee.findMany({
    select: { branchLocation: true, department: true },
  });

  const branches = Array.from(new Set(employees.map((e: { branchLocation: string | null }) => e.branchLocation).filter(Boolean))).sort() as string[];
  const departments = Array.from(new Set(employees.map((e: { department: string | null }) => e.department).filter(Boolean))).sort() as string[];

  return NextResponse.json({ branches, departments });
}
