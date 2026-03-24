import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTenantDb } from "@/lib/tenant";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR" && !(user as any).isSupervisor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await getTenantDb(user.orgId);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const where = status ? `WHERE status='${status}'` : "";
  const rows = await db.execute(`SELECT * FROM LeaveRequest ${where} ORDER BY createdAt DESC LIMIT 100`);
  return NextResponse.json(rows.rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR" && !(user as any).isSupervisor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await getTenantDb(user.orgId);
  const body = await req.json();
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO LeaveRequest (id, employeeId, employeeName, department, leaveType, startDate, endDate, days, reason, status, orgId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      id,
      body.employeeId || "",
      body.employeeName,
      body.department || null,
      body.leaveType || "Vacation",
      body.startDate,
      body.endDate,
      body.days || 1,
      body.reason || null,
      body.status || "Pending",
      (user as any).orgId || null,
      now,
      now,
    ],
  });
  return NextResponse.json({ id }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR" && !(user as any).isSupervisor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await getTenantDb(user.orgId);
  const body = await req.json();
  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE LeaveRequest SET status=?, adminComment=?, updatedAt=? WHERE id=?`,
    args: [body.status, body.adminComment || null, now, body.id],
  });
  return NextResponse.json({ success: true });
}
