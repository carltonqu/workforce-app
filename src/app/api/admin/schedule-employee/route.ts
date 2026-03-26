import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/api-guard";
import { getTenantDb } from "@/lib/tenant";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const planGuard = await requireFeature("scheduling");
  if (planGuard) return planGuard;
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR" && !(user as any).isSupervisor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await getTenantDb(user.orgId);
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || new Date().toISOString().slice(0, 10);
  const to = searchParams.get("to") || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const rows = await db.execute({
    sql: "SELECT es.*, u.name as userName, COALESCE(e.fullName, u.name) as employeeName FROM EmployeeShift es JOIN User u ON es.userId = u.id LEFT JOIN Employee e ON u.linkedEmployeeId = e.id WHERE es.date >= ? AND es.date <= ? ORDER BY es.date ASC, es.shiftStart ASC",
    args: [from, to],
  });
  return NextResponse.json(rows.rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const planGuard = await requireFeature("scheduling");
  if (planGuard) return planGuard;
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR" && !(user as any).isSupervisor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await getTenantDb(user.orgId);
  const body = await req.json();
  const { userId, date, shiftStart, shiftEnd, shiftName, location, isRestDay, isHoliday } = body;
  if (!userId || !date || !shiftStart || !shiftEnd) {
    return NextResponse.json({ error: "userId, date, shiftStart, shiftEnd are required" }, { status: 400 });
  }
  // Check if shift already exists for this user+date, update it
  const existing = await db.execute({
    sql: "SELECT id FROM EmployeeShift WHERE userId=? AND date=?",
    args: [userId, date],
  });
  const now = new Date().toISOString();
  if (existing.rows.length) {
    await db.execute({
      sql: "UPDATE EmployeeShift SET shiftStart=?, shiftEnd=?, shiftName=?, location=?, isRestDay=?, isHoliday=? WHERE userId=? AND date=?",
      args: [shiftStart, shiftEnd, shiftName || "Regular", location || null, isRestDay ? 1 : 0, isHoliday ? 1 : 0, userId, date],
    });
    return NextResponse.json({ success: true, updated: true });
  }
  const id = randomUUID();
  await db.execute({
    sql: "INSERT INTO EmployeeShift (id, userId, date, shiftStart, shiftEnd, shiftName, location, isRestDay, isHoliday, orgId, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
    args: [id, userId, date, shiftStart, shiftEnd, shiftName || "Regular", location || null, isRestDay ? 1 : 0, isHoliday ? 1 : 0, user.orgId || null, now],
  });
  return NextResponse.json({ id, success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const planGuard = await requireFeature("scheduling");
  if (planGuard) return planGuard;
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR" && !(user as any).isSupervisor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await getTenantDb(user.orgId);
  const body = await req.json();
  await db.execute({ sql: "DELETE FROM EmployeeShift WHERE id=?", args: [body.id] });
  return NextResponse.json({ success: true });
}
