"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Clock, ClipboardList, AlertTriangle, DollarSign,
  TrendingUp, AlarmClock, UserX, Plane, CheckSquare,
  UserPlus, CalendarPlus, Activity, RefreshCw, ArrowRight,
  Settings, Database, Shield, BarChart3, Megaphone,
  Server, Zap, Lock
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
  totalReleased: number;
  totalApproved: number;
  expectedTotal: number;
  entryCount: number;
  draftCount: number;
  approvedCount: number;
  releasedCount: number;
}

interface SystemHealth {
  status: "healthy" | "warning" | "error";
  uptime: string;
  lastBackup: string;
  storageUsed: string;
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
  systemHealth?: SystemHealth;
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

function SystemHealthBadge({ health }: { health?: SystemHealth }) {
  if (!health) return null;
  
  const colors = {
    healthy: "bg-emerald-100 text-emerald-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${colors[health.status]}`}>
      <Server className="w-3.5 h-3.5" />
      <span>System {health.status}</span>
      <span className="w-1 h-1 rounded-full bg-current opacity-50" />
      <span>Uptime: {health.uptime}</span>
    </div>
  );
}

export function AdminDashboardClient({ user }: { user: any }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        // Add mock system health data
        data.systemHealth = {
          status: "healthy",
          uptime: "99.9%",
          lastBackup: "2 hours ago",
          storageUsed: "45%",
        };
        setStats(data);
      }
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

      {/* ── Admin Header Banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                  Full Access
                </span>
              </div>
              <p className="text-sm text-blue-100 mt-0.5">{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SystemHealthBadge health={stats.systemHealth} />
            <Button size="sm" variant="outline" onClick={fetchStats} className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* ── Financial Summary ── */}
      {(() => {
        const fs = stats.financialSummary;
        const fmt = (v: number) =>
          "₱" + v.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const hasData = fs && fs.entryCount > 0;
        return (
          <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 p-5 text-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Financial Overview — {fs?.month ?? "This Month"}
                  </p>

                  {hasData ? (
                    <>
                      <div className="flex items-baseline gap-3 mt-1 flex-wrap">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Cash Out (Released)</p>
                          <p className="text-3xl font-bold tracking-tight">{fmt(fs!.totalReleased)}</p>
                        </div>
                        {fs!.totalApproved > 0 && (
                          <div className="border-l border-white/20 pl-3">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Pending Release</p>
                            <p className="text-xl font-semibold text-yellow-300">{fmt(fs!.totalApproved)}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Total Net Pay</p>
                          <p className="text-sm font-semibold">{fmt(fs!.totalNet)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Gross Pay</p>
                          <p className="text-sm font-semibold">{fmt(fs!.totalGross)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Deductions</p>
                          <p className="text-sm font-semibold">{fmt(fs!.totalDeductions)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Payslips</p>
                          <p className="text-sm font-semibold">{fs!.entryCount}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3 flex-wrap">
                        {fs!.releasedCount > 0 && (
                          <span className="text-xs bg-green-500/30 text-green-100 px-2 py-0.5 rounded-full font-medium">
                            ✓ {fs!.releasedCount} Released
                          </span>
                        )}
                        {fs!.approvedCount > 0 && (
                          <span className="text-xs bg-yellow-500/30 text-yellow-100 px-2 py-0.5 rounded-full font-medium">
                            ⏳ {fs!.approvedCount} Approved
                          </span>
                        )}
                        {fs!.draftCount > 0 && (
                          <span className="text-xs bg-white/20 text-slate-200 px-2 py-0.5 rounded-full font-medium">
                            📝 {fs!.draftCount} Draft
                          </span>
                        )}
                        {stats.payrollAlerts > 0 && (
                          <span className="text-xs bg-red-500/30 text-red-100 px-2 py-0.5 rounded-full font-medium">
                            ⚠ {stats.payrollAlerts} missing info
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Total Required Cash Out This Month</p>
                      <p className="text-3xl font-bold tracking-tight">{fmt(fs?.expectedTotal ?? 0)}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Based on {stats.activeEmployees} active employee salary rates · No payslips processed yet
                      </p>
                      {stats.payrollAlerts > 0 && (
                        <span className="inline-block mt-2 text-xs bg-red-500/30 text-red-100 px-2 py-0.5 rounded-full font-medium">
                          ⚠ {stats.payrollAlerts} employees missing salary info
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <Link href="/finance" className="flex-shrink-0 self-start">
                <button className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-100 transition px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap">
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
          <Card key={label} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
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

      {/* ── Admin Quick Actions ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Admin Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/employees", label: "Manage Users", Icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50", desc: "Add/Edit/Delete" },
            { href: "/settings", label: "System Settings", Icon: Settings, color: "text-purple-600", bg: "bg-purple-50", desc: "Company & Config" },
            { href: "/finance", label: "View All Reports", Icon: BarChart3, color: "text-green-600", bg: "bg-green-50", desc: "Analytics & Data" },
            { href: "/announcements", label: "Announcements", Icon: Megaphone, color: "text-indigo-600", bg: "bg-indigo-50", desc: "Company-wide" },
          ].map(({ href, label, Icon, color, bg, desc }) => (
            <Link key={href} href={href}>
              <div className={`${bg} rounded-xl p-4 flex flex-col hover:shadow-md transition cursor-pointer border border-transparent hover:border-gray-200`}>
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                </div>
                <p className="text-xs text-gray-500 ml-8">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── System Management Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* User Management */}
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">User Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/employees" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span className="text-sm text-gray-700">Manage Employees</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link href="/supervisor-assignments" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span className="text-sm text-gray-700">Assign Supervisors</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-60">
              <span className="text-sm text-gray-500">Role Permissions</span>
              <Lock className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Database className="w-4 h-4 text-purple-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">System & Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/settings" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span className="text-sm text-gray-700">Company Settings</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
              <span className="text-sm text-gray-700">Backup & Restore</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-600">{stats.systemHealth?.lastBackup || "2h ago"}</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
              <span className="text-sm text-gray-700">Integrations</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Reports & Analytics */}
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <BarChart3 className="w-4 h-4 text-green-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">All Reports</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/finance" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span className="text-sm text-gray-700">Payroll Summary</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link href="/attendance" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span className="text-sm text-gray-700">Attendance Analytics</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link href="/performance" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span className="text-sm text-gray-700">Performance Metrics</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom split ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Today's Attendance */}
        <Card className="lg:col-span-3 border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-md">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Today&apos;s Attendance</CardTitle>
            </div>
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
        <Card className="lg:col-span-2 border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-50 rounded-md">
                <ClipboardList className="w-4 h-4 text-orange-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Pending Approvals</CardTitle>
            </div>
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

      {/* ── Recent Activity ── */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-50 rounded-md">
              <Zap className="w-4 h-4 text-slate-600" />
            </div>
            <CardTitle className="text-sm font-semibold text-gray-700">Recent System Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No recent activity</p>
          ) : (
            <div className="space-y-2">
              {stats.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.employeeName}</p>
                      <p className="text-xs text-gray-500">{activity.action}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
