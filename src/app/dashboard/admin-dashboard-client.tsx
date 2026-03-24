"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Clock, ClipboardList, AlertTriangle, DollarSign,
  TrendingUp, AlarmClock, UserX, Plane, CheckSquare,
  UserPlus, CalendarPlus, Activity, RefreshCw, ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface AttendanceRecord {
  id: string;
  employeeName: string;
  department: string | null;
  status: string;
  actualIn: string | null;
  actualOut: string | null;
}

interface ApprovalItem {
  id: string;
  employeeName: string;
  requestType: string;
  createdAt: string;
}

interface FinancialSummary {
  month: string;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  entryCount: number;
  draftCount: number;
  approvedCount: number;
  releasedCount: number;
}

interface AdminStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  onLeaveEmployees: number;
  clockedInNow: number;
  lateToday: number;
  absentToday: number;
  pendingApprovals: number;
  payrollAlerts: number;
  todayAttendance: AttendanceRecord[];
  pendingApprovalsList: ApprovalItem[];
  recentActivity: { id: string; employeeName: string; action: string; time: string }[];
  financialSummary?: FinancialSummary;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Clocked In": "bg-green-100 text-green-700",
    Present: "bg-blue-100 text-blue-700",
    Late: "bg-yellow-100 text-yellow-700",
    Absent: "bg-red-100 text-red-700",
    "On Leave": "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status === "Clocked In" && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
      {status}
    </span>
  );
}

export function AdminDashboardClient({ user: _user }: { user: any }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleApproval = async (id: string, status: "Approved" | "Rejected") => {
    setActionLoading(id + status);
    try {
      await fetch(`/api/admin/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchStats();
    } finally { setActionLoading(null); }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
      </div>
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  );

  if (!stats) return (
    <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
      Failed to load.{" "}
      <button onClick={fetchStats} className="ml-2 text-blue-600 underline">Retry</button>
    </div>
  );

  const attendanceRate = stats.totalEmployees > 0
    ? Math.round((stats.clockedInNow / stats.activeEmployees) * 100)
    : 0;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">{today}</p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchStats} className="gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* ── Financial Summary (admin only) ── */}
      {(() => {
        const fs = stats.financialSummary;
        const fmt = (v: number) =>
          "₱" + v.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const hasData = fs && fs.entryCount > 0;
        return (
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-5 text-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-100 uppercase tracking-wider">
                    Financial Overview — {fs?.month ?? "This Month"}
                  </p>

                  {hasData ? (
                    <>
                      {/* Main figure */}
                      <p className="text-3xl font-bold mt-1 tracking-tight">{fmt(fs!.totalNet)}</p>
                      <p className="text-xs text-blue-200 mt-0.5">Total Net Pay this month</p>

                      {/* Breakdown row */}
                      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
                        <div>
                          <p className="text-[10px] text-blue-200 uppercase tracking-wider">Gross Pay</p>
                          <p className="text-sm font-semibold">{fmt(fs!.totalGross)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-200 uppercase tracking-wider">Deductions</p>
                          <p className="text-sm font-semibold">{fmt(fs!.totalDeductions)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-200 uppercase tracking-wider">Payslips</p>
                          <p className="text-sm font-semibold">{fs!.entryCount}</p>
                        </div>
                      </div>

                      {/* Status pills */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {fs!.releasedCount > 0 && (
                          <span className="text-xs bg-green-500/30 text-green-100 px-2 py-0.5 rounded-full font-medium">
                            {fs!.releasedCount} Released
                          </span>
                        )}
                        {fs!.approvedCount > 0 && (
                          <span className="text-xs bg-yellow-400/30 text-yellow-100 px-2 py-0.5 rounded-full font-medium">
                            {fs!.approvedCount} Approved
                          </span>
                        )}
                        {fs!.draftCount > 0 && (
                          <span className="text-xs bg-white/20 text-blue-100 px-2 py-0.5 rounded-full font-medium">
                            {fs!.draftCount} Draft
                          </span>
                        )}
                        {stats.payrollAlerts > 0 && (
                          <span className="text-xs bg-red-400/30 text-red-100 px-2 py-0.5 rounded-full font-medium">
                            ⚠ {stats.payrollAlerts} missing info
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-bold mt-1">No payroll data this month</p>
                      <p className="text-xs text-blue-200 mt-1">
                        {stats.activeEmployees} active employees · {stats.payrollAlerts} missing payroll info
                      </p>
                    </>
                  )}
                </div>
              </div>

              <Link href="/finance" className="flex-shrink-0 self-start">
                <button className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 transition px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap">
                  Full Report <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        );
      })()}

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Employees", value: stats.totalEmployees, sub: `${stats.activeEmployees} active`, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Clocked In Now", value: stats.clockedInNow, sub: `${attendanceRate}% attendance`, icon: Clock, color: "text-green-600", bg: "bg-green-50" },
          { label: "Pending Approvals", value: stats.pendingApprovals, sub: "need action", icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "On Leave Today", value: stats.onLeaveEmployees, sub: `${stats.absentToday} absent`, icon: Plane, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label} className="border border-gray-100 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
                <div className={`${bg} p-2 rounded-lg`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Alert Pills ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlarmClock className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-red-500 font-medium">Late Today</p>
            <p className="text-lg font-bold text-red-700">{stats.lateToday}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <UserX className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-red-500 font-medium">Absent Today</p>
            <p className="text-lg font-bold text-red-700">{stats.absentToday}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-orange-500 font-medium">Payroll Alerts</p>
            <p className="text-lg font-bold text-orange-700">{stats.payrollAlerts}</p>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/employees", label: "Add Employee", Icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50" },
            { href: "/scheduling", label: "Create Schedule", Icon: CalendarPlus, color: "text-purple-600", bg: "bg-purple-50" },
            { href: "/approvals", label: "Approvals", Icon: CheckSquare, color: "text-green-600", bg: "bg-green-50" },
            { href: "/attendance", label: "Attendance", Icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
          ].map(({ href, label, Icon, color, bg }) => (
            <Link key={href} href={href}>
              <div className={`${bg} rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition cursor-pointer border border-transparent hover:border-gray-100`}>
                <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
                <p className="text-sm font-medium text-gray-700">{label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Bottom split ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Today's Attendance */}
        <Card className="lg:col-span-3 border border-gray-100 shadow-none">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700">Today&apos;s Attendance</CardTitle>
            <Link href="/attendance" className="text-xs text-blue-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats.todayAttendance.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No records yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Employee</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-400 hidden sm:table-cell">Dept</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Status</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-400 hidden md:table-cell">In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.todayAttendance.slice(0, 8).map((rec) => (
                      <tr key={rec.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900 text-sm">{rec.employeeName}</td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs hidden sm:table-cell">{rec.department ?? "—"}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={rec.status} /></td>
                        <td className="px-4 py-2.5 text-gray-400 font-mono text-xs hidden md:table-cell">
                          {rec.actualIn ? new Date(rec.actualIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="lg:col-span-2 border border-gray-100 shadow-none">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700">Pending Approvals</CardTitle>
            {stats.pendingApprovals > 0 && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{stats.pendingApprovals}</span>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {stats.pendingApprovalsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <CheckSquare className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">All caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {stats.pendingApprovalsList.slice(0, 4).map((item) => (
                  <div key={item.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{item.employeeName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{item.requestType}</span>
                      <span className="text-xs text-gray-400">
                        {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : ""}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleApproval(item.id, "Approved")} disabled={!!actionLoading}
                        className="flex-1 text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition disabled:opacity-50">
                        {actionLoading === item.id + "Approved" ? "..." : "✓ Approve"}
                      </button>
                      <button onClick={() => handleApproval(item.id, "Rejected")} disabled={!!actionLoading}
                        className="flex-1 text-xs px-2 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium transition disabled:opacity-50">
                        {actionLoading === item.id + "Rejected" ? "..." : "✗ Reject"}
                      </button>
                    </div>
                  </div>
                ))}
                {stats.pendingApprovals > 4 && (
                  <div className="px-4 py-2 text-center">
                    <Link href="/approvals" className="text-xs text-blue-600 hover:underline">
                      View {stats.pendingApprovals - 4} more →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
