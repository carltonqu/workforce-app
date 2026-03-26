import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/api-guard";
import { getTenantDb } from "@/lib/tenant";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const planGuard = await requireFeature("approvals");
  if (planGuard) return planGuard;
  const user = session.user as any;
  const db = await getTenantDb(user.orgId);
  const rows = await db.execute({
    sql: "SELECT * FROM ApprovalRequest WHERE employeeId=? ORDER BY createdAt DESC",
    args: [user.id],
  });
  const leaveRows = await db.execute({
    sql: "SELECT *, 'Leave Request' as requestType FROM LeaveRequest WHERE employeeId=? ORDER BY createdAt DESC",
    args: [user.id],
  });
  const combined = [...rows.rows, ...leaveRows.rows].sort((a: any, b: any) =>
    new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
  );
  return NextResponse.json(combined);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const planGuard = await requireFeature("approvals");
  if (planGuard) return planGuard;
  const user = session.user as any;
  const db = await getTenantDb(user.orgId);
  const body = await req.json();
  const { requestType, details, leaveType, startDate, endDate, days, reason } = body;
  const id = randomUUID();
  const now = new Date().toISOString();

  if (requestType === "Leave Request") {
    await db.execute({
      sql: "INSERT INTO LeaveRequest (id, employeeId, employeeName, department, leaveType, startDate, endDate, days, reason, status, orgId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
      args: [id, user.id, user.name, body.department || null, leaveType || "Vacation", startDate, endDate, days || 1, reason || null, "Pending", user.orgId || null, now, now],
    });
  } else {
    await db.execute({
      sql: "INSERT INTO ApprovalRequest (id, employeeId, employeeName, department, requestType, details, status, priority, orgId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      args: [id, user.id, user.name, body.department || null, requestType, details || null, "Pending", "Normal", user.orgId || null, now, now],
    });
  }
  return NextResponse.json({ id }, { status: 201 });
}
