"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Clock,
  ClipboardList,
  AlertTriangle,
  AlarmClock,
  UserX,
  Plane,
  UserMinus,
  UserPlus,
  CalendarPlus,
  CheckSquare,
  Activity,
  DollarSign,
  FileDown,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  isLate: number;
  lateMinutes: number;
}

interface ApprovalItem {
  id: string;
  employeeName: string;
  department: string | null;
  requestType: string;
  details: string | null;
  status: string;
  priority: string;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  employeeName: string;
  action: string;
  time: string;
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
  recentActivity: ActivityItem[];
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="lg:col-span-2 h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Present: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    Late: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    Absent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    "On Leave": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
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
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleApproval = async (id: string, status: "Approved" | "Rejected", isLeave = false) => {
    setActionLoading(id + status);
    try {
      await fetch(`/api/admin/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, isLeave }),
      });
      await fetchStats();
    } finally {
      setActionLoading(null);
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) return <LoadingSkeleton />;

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Failed to load dashboard data.{" "}
        <button onClick={fetchStats} className="ml-2 text-blue-600 underline">
          Retry
        </button>
      </div>
    );
  }

  const quickActions = [
    { href: "/employees", label: "Add Employee", Icon: UserPlus, bg: "bg-blue-50 dark:bg-blue-950", color: "text-blue-600" },
    { href: "/scheduling", label: "Create Schedule", Icon: CalendarPlus, bg: "bg-purple-50 dark:bg-purple-950", color: "text-purple-600" },
    { href: "/approvals", label: "Approve Requests", Icon: CheckSquare, bg: "bg-green-50 dark:bg-green-950", color: "text-green-600" },
    { href: "/attendance", label: "Monitor Attendance", Icon: Activity, bg: "bg-indigo-50 dark:bg-indigo-950", color: "text-indigo-600" },
    { href: "/payroll", label: "Process Payroll", Icon: DollarSign, bg: "bg-emerald-50 dark:bg-emerald-950", color: "text-emerald-600" },
    { href: "/reports", label: "Export Reports", Icon: FileDown, bg: "bg-gray-100 dark:bg-gray-800", color: "text-gray-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Section A: Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Today: {today}</p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchStats} className="flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Section B: KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalEmployees}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.activeEmployees} active</p>
              </div>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Clocked In Now</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.clockedInNow}</p>
                <p className="text-xs text-gray-400 mt-1">currently working</p>
              </div>
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pending Approvals</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.pendingApprovals}</p>
                <p className="text-xs text-gray-400 mt-1">need action</p>
              </div>
              <div className="p-2.5 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <ClipboardList className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Payroll Alerts</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.payrollAlerts}</p>
                <p className="text-xs text-gray-400 mt-1">need attention</p>
              </div>
              <div className="p-2.5 bg-red-50 dark:bg-red-950 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section C: Alert Pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 rounded-xl px-4 py-3">
          <AlarmClock className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-red-500 font-medium">Late Today</p>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">{stats.lateToday}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 rounded-xl px-4 py-3">
          <UserX className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-red-500 font-medium">Absent Today</p>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">{stats.absentToday}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-xl px-4 py-3">
          <Plane className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-blue-500 font-medium">On Leave</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{stats.onLeaveEmployees}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3">
          <UserMinus className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium">Inactive/Terminated</p>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{stats.inactiveEmployees}</p>
          </div>
        </div>
      </div>

      {/* Section D: Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map(({ href, label, Icon, bg, color }) => (
            <Link key={href} href={href}>
              <div className={`${bg} rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 p-4 text-center hover:shadow-md transition-all cursor-pointer`}>
                <Icon className={`w-6 h-6 ${color} mx-auto mb-2`} />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight">{label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Section E: Two column split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Today's Attendance */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Today&apos;s Attendance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.todayAttendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Calendar className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">No attendance records for today</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Employee</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Dept</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">In</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Out</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Late?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.todayAttendance.map((rec) => (
                      <tr key={rec.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{rec.employeeName}</td>
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{rec.department ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={rec.status} />
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{rec.actualIn ?? "—"}</td>
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{rec.actualOut ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          {rec.isLate ? (
                            <span className="text-yellow-600 text-xs font-medium">+{rec.lateMinutes}m</span>
                          ) : (
                            <span className="text-green-600 text-xs">On time</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Pending Approvals */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Pending Approvals</CardTitle>
              {stats.pendingApprovals > 0 && (
                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 text-xs">
                  {stats.pendingApprovals}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {stats.pendingApprovalsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <CheckSquare className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">All caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {stats.pendingApprovalsList.map((item) => (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.employeeName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {item.requestType}
                          </span>
                          <span className="text-xs text-gray-400">
                            {item.createdAt
                              ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <button
                        onClick={() => handleApproval(item.id, "Approved")}
                        disabled={!!actionLoading}
                        className="flex-1 text-xs px-2 py-1 rounded bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900 font-medium transition-colors disabled:opacity-50"
                      >
                        {actionLoading === item.id + "Approved" ? "..." : "✓ Approve"}
                      </button>
                      <button
                        onClick={() => handleApproval(item.id, "Rejected")}
                        disabled={!!actionLoading}
                        className="flex-1 text-xs px-2 py-1 rounded bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 font-medium transition-colors disabled:opacity-50"
                      >
                        {actionLoading === item.id + "Rejected" ? "..." : "✗ Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section F: Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 8).map((item, idx) => {
                const colors = [
                  "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500",
                  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-red-500",
                ];
                return (
                  <div key={item.id + idx} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[idx % colors.length]}`} />
                    <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      <span className="font-medium">{item.employeeName}</span>
                      {" — "}
                      <span className="text-gray-500 dark:text-gray-400">{item.action}</span>
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {item.time
                        ? formatDistanceToNow(new Date(item.time), { addSuffix: true })
                        : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
