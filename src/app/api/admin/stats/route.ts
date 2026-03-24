import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTenantDb } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR" && !(user as any).isSupervisor)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = await getTenantDb(user.orgId);

  const [
    totalRes,
    activeRes,
    inactiveRes,
    onLeaveRes,
    clockedInRes,
    payrollAlertsRes,
    pendingApprovalsRes,
    pendingLeaveRes,
    todayAttRes,
    pendingApprListRes,
    recentActRes,
  ] = await Promise.all([
    // Employee counts
    db.execute("SELECT COUNT(*) as cnt FROM Employee"),
    db.execute("SELECT COUNT(*) as cnt FROM Employee WHERE employmentStatus='Active'"),
    db.execute("SELECT COUNT(*) as cnt FROM Employee WHERE employmentStatus='Inactive' OR employmentStatus='Terminated'"),
    db.execute("SELECT COUNT(*) as cnt FROM Employee WHERE employmentStatus='On Leave'"),

    // Clocked in NOW — from real TimeEntry data
    db.execute("SELECT COUNT(*) as cnt FROM TimeEntry WHERE clockOut IS NULL AND DATE(clockIn) = DATE('now')"),

    // Payroll alerts
    db.execute("SELECT COUNT(*) as cnt FROM Employee WHERE employmentStatus='Active' AND (salaryRate IS NULL OR bankDetails IS NULL)"),

    // Pending approvals
    db.execute("SELECT COUNT(*) as cnt FROM ApprovalRequest WHERE status='Pending'"),
    db.execute("SELECT COUNT(*) as cnt FROM LeaveRequest WHERE status='Pending'"),

    // Today's attendance — join TimeEntry + User + Employee for real-time data
    db.execute(`
      SELECT
        te.id,
        te.userId,
        COALESCE(e.fullName, u.name) AS employeeName,
        COALESCE(e.department, '') AS department,
        te.clockIn AS actualIn,
        te.clockOut AS actualOut,
        CASE WHEN te.clockOut IS NULL THEN 'Clocked In' ELSE 'Present' END AS status,
        te.overtimeMinutes
      FROM TimeEntry te
      JOIN User u ON te.userId = u.id
      LEFT JOIN Employee e ON u.linkedEmployeeId = e.id
      WHERE DATE(te.clockIn) = DATE('now')
      ORDER BY te.clockIn DESC
      LIMIT 100
    `),

    // Pending approvals list
    db.execute(`
      SELECT id, employeeId, employeeName, department, requestType, details, status, priority, createdAt
      FROM ApprovalRequest WHERE status='Pending' ORDER BY createdAt DESC LIMIT 20
    `),

    // Recent activity — from real TimeEntry
    db.execute(`
      SELECT
        te.id,
        COALESCE(e.fullName, u.name) AS employeeName,
        CASE WHEN te.clockOut IS NULL THEN 'Clocked In' ELSE 'Clocked Out' END AS action,
        CASE WHEN te.clockOut IS NULL THEN te.clockIn ELSE te.clockOut END AS time
      FROM TimeEntry te
      JOIN User u ON te.userId = u.id
      LEFT JOIN Employee e ON u.linkedEmployeeId = e.id
      ORDER BY CASE WHEN te.clockOut IS NULL THEN te.clockIn ELSE te.clockOut END DESC
      LIMIT 15
    `),
  ]);

  const n = (r: any) => Number(r.rows[0]?.cnt ?? 0);

  // Compute late/absent from today's records
  // Late = clocked in but more than 0 overtime shift would show late; for now flag from AttendanceLog if exists, else 0
  const todayRows = todayAttRes.rows.map((r: any) => ({
    id: r.id as string,
    userId: r.userId as string,
    employeeName: r.employeeName as string,
    department: (r.department as string) || null,
    status: r.status as string,
    actualIn: r.actualIn as string,
    actualOut: (r.actualOut as string) || null,
    overtimeMinutes: Number(r.overtimeMinutes ?? 0),
  }));

  return NextResponse.json({
    totalEmployees: n(totalRes),
    activeEmployees: n(activeRes),
    inactiveEmployees: n(inactiveRes),
    onLeaveEmployees: n(onLeaveRes),
    clockedInNow: n(clockedInRes),
    lateToday: 0, // extend later with shift comparison
    absentToday: 0,
    pendingApprovals: n(pendingApprovalsRes) + n(pendingLeaveRes),
    payrollAlerts: n(payrollAlertsRes),
    todayAttendance: todayRows,
    pendingApprovalsList: pendingApprListRes.rows.map((r: any) => ({
      id: r.id,
      employeeName: r.employeeName,
      department: r.department,
      requestType: r.requestType,
      details: r.details,
      status: r.status,
      priority: r.priority,
      createdAt: r.createdAt,
    })),
    recentActivity: recentActRes.rows.map((r: any) => ({
      id: r.id,
      employeeName: r.employeeName,
      action: r.action,
      time: r.time,
    })),
  });
}
