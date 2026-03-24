import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/api-guard";
import { getTenantDb } from "@/lib/tenant";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR" && !(user as any).isSupervisor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const planGuard = await requireFeature("approvals");
  if (planGuard) return planGuard;
  const db = await getTenantDb(user.orgId);
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "";
  const whereType = type ? `WHERE requestType='${type}'` : "";
  const rows = await db.execute(`SELECT * FROM ApprovalRequest ${whereType} ORDER BY createdAt DESC LIMIT 100`);
  const leaveRows = await db.execute(
    `SELECT id, employeeId, employeeName, department, 'Leave Request' as requestType, leaveType || ': ' || startDate || ' to ' || endDate as details, status, 'Normal' as priority, createdAt, adminComment FROM LeaveRequest ORDER BY createdAt DESC LIMIT 100`
  );
  const combined = [...rows.rows, ...leaveRows.rows].sort((a: any, b: any) => {
    return new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime();
  });
  return NextResponse.json(combined);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR" && !(user as any).isSupervisor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const planGuard = await requireFeature("approvals");
  if (planGuard) return planGuard;
  const db = await getTenantDb(user.orgId);
  const body = await req.json();
  const id = randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO ApprovalRequest (id, employeeId, employeeName, department, requestType, details, status, priority, orgId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    args: [id, body.employeeId || "", body.employeeName, body.department || null, body.requestType, body.details || null, "Pending", body.priority || "Normal", (user as any).orgId || null, now, now],
  });
  return NextResponse.json({ id }, { status: 201 });
}
