import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@libsql/client";

function getDb() {
  return createClient({
    url: (process.env.DATABASE_URL ?? "").replace("libsql://", "https://"),
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  const [
    totalRes, activeRes, inactiveRes, onLeaveRes,
    clockedInRes, lateRes, absentRes, pendingApprovalsRes,
    pendingLeaveRes, payrollAlertsRes, todayAttRes, pendingApprListRes, recentActRes
  ] = await Promise.all([
    db.execute("SELECT COUNT(*) as cnt FROM Employee"),
    db.execute("SELECT COUNT(*) as cnt FROM Employee WHERE employmentStatus='Active'"),
    db.execute("SELECT COUNT(*) as cnt FROM Employee WHERE employmentStatus='Inactive' OR employmentStatus='Terminated'"),
    db.execute("SELECT COUNT(*) as cnt FROM Employee WHERE employmentStatus='On Leave'"),
    db.execute("SELECT COUNT(*) as cnt FROM TimeEntry WHERE clockOut IS NULL"),
    db.execute(`SELECT COUNT(*) as cnt FROM AttendanceLog WHERE date='${today}' AND isLate=1`),
    db.execute(`SELECT COUNT(*) as cnt FROM AttendanceLog WHERE date='${today}' AND status='Absent'`),
    db.execute("SELECT COUNT(*) as cnt FROM ApprovalRequest WHERE status='Pending'"),
    db.execute("SELECT COUNT(*) as cnt FROM LeaveRequest WHERE status='Pending'"),
    db.execute("SELECT COUNT(*) as cnt FROM Employee WHERE employmentStatus='Active' AND (salaryRate IS NULL OR bankDetails IS NULL)"),
    db.execute(`SELECT id, employeeId, employeeName, department, status, actualIn, actualOut, isLate, lateMinutes FROM AttendanceLog WHERE date='${today}' ORDER BY createdAt DESC LIMIT 50`),
    db.execute("SELECT id, employeeId, employeeName, department, requestType, details, status, priority, createdAt FROM ApprovalRequest WHERE status='Pending' ORDER BY createdAt DESC LIMIT 20"),
    db.execute("SELECT id, employeeName, 'Attendance' as action, createdAt as time FROM AttendanceLog ORDER BY createdAt DESC LIMIT 10"),
  ]);

  const n = (r: any) => Number(r.rows[0]?.cnt ?? 0);

  return NextResponse.json({
    totalEmployees: n(totalRes),
    activeEmployees: n(activeRes),
    inactiveEmployees: n(inactiveRes),
    onLeaveEmployees: n(onLeaveRes),
    clockedInNow: n(clockedInRes),
    lateToday: n(lateRes),
    absentToday: n(absentRes),
    pendingApprovals: n(pendingApprovalsRes) + n(pendingLeaveRes),
    payrollAlerts: n(payrollAlertsRes),
    todayAttendance: todayAttRes.rows.map(r => ({
      id: r.id,
      employeeName: r.employeeName,
      department: r.department,
      status: r.status,
      actualIn: r.actualIn,
      actualOut: r.actualOut,
      isLate: r.isLate,
      lateMinutes: r.lateMinutes,
    })),
    pendingApprovalsList: pendingApprListRes.rows.map(r => ({
      id: r.id,
      employeeName: r.employeeName,
      department: r.department,
      requestType: r.requestType,
      details: r.details,
      status: r.status,
      priority: r.priority,
      createdAt: r.createdAt,
    })),
    recentActivity: recentActRes.rows.map(r => ({
      id: r.id,
      employeeName: r.employeeName,
      action: r.action,
      time: r.time,
    })),
  });
}
