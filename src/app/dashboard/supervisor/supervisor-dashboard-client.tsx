"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users, Clock, ClipboardList, CheckSquare, Activity,
  TrendingUp, Plane, Calendar, Megaphone, ArrowRight,
  UserCheck, AlertCircle, RefreshCw, BarChart3,
  Send, UserX, FileCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface TeamMember {
  id: string;
  name: string;
  position: string;
  department: string;
  status: "active" | "on_leave" | "absent";
  clockedIn: boolean;
  lastClockIn?: string;
}

interface Task {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
}

interface LeaveRequest {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface TeamStats {
  totalMembers: number;
  activeNow: number;
  onLeave: number;
  absentToday: number;
  pendingTasks: number;
  pendingLeaveRequests: number;
}

interface SupervisorStats {
  teamStats: TeamStats;
  teamMembers: TeamMember[];
  tasks: Task[];
  leaveRequests: LeaveRequest[];
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    on_leave: "bg-purple-100 text-purple-700",
    absent: "bg-red-100 text-red-700",
    present: "bg-blue-100 text-blue-700",
    late: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status === "active" && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
      {status.replace("_", " ")}
    </span>
  );
}

function TaskPriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[priority]}`}>
      {priority}
    </span>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function SupervisorDashboardClient({ user }: { user: any }) {
  const [stats, setStats] = useState<SupervisorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // Mock data for supervisor dashboard
      const mockStats: SupervisorStats = {
        teamStats: {
          totalMembers: 8,
          activeNow: 6,
          onLeave: 1,
          absentToday: 1,
          pendingTasks: 5,
          pendingLeaveRequests: 2,
        },
        teamMembers: [
          { id: "1", name: "Alice Johnson", position: "Developer", department: "Engineering", status: "active", clockedIn: true, lastClockIn: "08:30 AM" },
          { id: "2", name: "Bob Smith", position: "Designer", department: "Design", status: "active", clockedIn: true, lastClockIn: "09:00 AM" },
          { id: "3", name: "Carol White", position: "QA Engineer", department: "Engineering", status: "active", clockedIn: false },
          { id: "4", name: "David Brown", position: "Product Manager", department: "Product", status: "on_leave", clockedIn: false },
          { id: "5", name: "Emma Davis", position: "Developer", department: "Engineering", status: "absent", clockedIn: false },
          { id: "6", name: "Frank Miller", position: "DevOps", department: "Engineering", status: "active", clockedIn: true, lastClockIn: "08:45 AM" },
          { id: "7", name: "Grace Lee", position: "Designer", department: "Design", status: "active", clockedIn: true, lastClockIn: "09:15 AM" },
          { id: "8", name: "Henry Wilson", position: "Developer", department: "Engineering", status: "active", clockedIn: true, lastClockIn: "08:50 AM" },
        ],
        tasks: [
          { id: "1", title: "Complete Q3 Report", assignedTo: "Alice Johnson", dueDate: "2024-04-25", status: "in_progress", priority: "high" },
          { id: "2", title: "Review Design Mockups", assignedTo: "Bob Smith", dueDate: "2024-04-26", status: "pending", priority: "medium" },
          { id: "3", title: "Fix Bug #1234", assignedTo: "Henry Wilson", dueDate: "2024-04-24", status: "completed", priority: "high" },
          { id: "4", title: "Update Documentation", assignedTo: "Frank Miller", dueDate: "2024-04-28", status: "pending", priority: "low" },
          { id: "5", title: "Team Meeting Prep", assignedTo: "Grace Lee", dueDate: "2024-04-25", status: "in_progress", priority: "medium" },
        ],
        leaveRequests: [
          { id: "1", employeeName: "David Brown", leaveType: "Vacation", startDate: "2024-04-24", endDate: "2024-04-26", status: "pending", createdAt: "2024-04-20T10:00:00Z" },
          { id: "2", employeeName: "Emma Davis", leaveType: "Sick Leave", startDate: "2024-04-24", endDate: "2024-04-24", status: "pending", createdAt: "2024-04-23T08:00:00Z" },
        ],
      };
      setStats(mockStats);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleLeaveApproval = async (id: string, status: "approved" | "rejected") => {
    setActionLoading(id + status);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchStats();
    } finally { setActionLoading(null); }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-28 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
      </div>
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  );

  if (!stats) return (
    <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
      Failed to load.{" "}
      <button onClick={fetchStats} className="ml-2 text-purple-600 underline">Retry</button>
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Supervisor Header Banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-violet-400 p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">Supervisor Dashboard</h1>
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                  Team Lead
                </span>
              </div>
              <p className="text-sm text-purple-100 mt-0.5">{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
              <Users className="w-4 h-4" />
              <span className="text-sm">{stats.teamStats.totalMembers} Team Members</span>
            </div>
            <Button size="sm" variant="outline" onClick={fetchStats} className="gap-1.5 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* ── Team Stats KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Now", value: stats.teamStats.activeNow, sub: "clocked in", icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
          { label: "Team Size", value: stats.teamStats.totalMembers, sub: "total members", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Pending Tasks", value: stats.teamStats.pendingTasks, sub: "need attention", icon: FileCheck, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "On Leave", value: stats.teamStats.onLeave + stats.teamStats.absentToday, sub: "absent today", icon: UserX, color: "text-red-600", bg: "bg-red-50" },
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

      {/* ── Supervisor Quick Actions ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Supervisor Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/employees", label: "View Team", Icon: Users, color: "text-purple-600", bg: "bg-purple-50", desc: "Team members" },
            { href: "/supervisor-assignments", label: "Assign Tasks", Icon: FileCheck, color: "text-blue-600", bg: "bg-blue-50", desc: "Manage work" },
            { href: "/leave", label: "Approve Leave", Icon: CheckSquare, color: "text-green-600", bg: "bg-green-50", desc: "Review requests" },
            { href: "/announcements", label: "Send Announcement", Icon: Send, color: "text-indigo-600", bg: "bg-indigo-50", desc: "Team updates" },
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

      {/* ── Team Overview & Tasks Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Team Members */}
        <Card className="lg:col-span-3 border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 rounded-md">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">My Team</CardTitle>
            </div>
            <Link href="/attendance" className="text-xs text-purple-600 hover:underline">View attendance</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Employee</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-400 hidden sm:table-cell">Position</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Status</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-400 hidden md:table-cell">Clock In</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.teamMembers.slice(0, 6).map((member) => (
                    <tr key={member.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-purple-600">{member.name.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs hidden sm:table-cell">{member.position}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={member.status} /></td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs hidden md:table-cell">
                        {member.clockedIn ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            {member.lastClockIn}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {stats.teamMembers.length > 6 && (
              <div className="px-4 py-2 text-center border-t border-gray-50">
                <Link href="/employees" className="text-xs text-purple-600 hover:underline">
                  View all {stats.teamMembers.length} members →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Leave Requests */}
        <Card className="lg:col-span-2 border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-50 rounded-md">
                <Plane className="w-4 h-4 text-orange-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Leave Approvals</CardTitle>
            </div>
            {stats.teamStats.pendingLeaveRequests > 0 && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                {stats.teamStats.pendingLeaveRequests} pending
              </span>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {stats.leaveRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <CheckSquare className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No pending requests</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {stats.leaveRequests.map((request) => (
                  <div key={request.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{request.employeeName}</p>
                      <span className="text-xs text-gray-400">{request.leaveType}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(request.startDate).toLocaleDateString()} — {new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleLeaveApproval(request.id, "approved")} 
                          disabled={!!actionLoading}
                          className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition disabled:opacity-50"
                        >
                          {actionLoading === request.id + "approved" ? "..." : "Approve"}
                        </button>
                        <button 
                          onClick={() => handleLeaveApproval(request.id, "rejected")} 
                          disabled={!!actionLoading}
                          className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium transition disabled:opacity-50"
                        >
                          {actionLoading === request.id + "rejected" ? "..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Task Management & Reports Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Task Management */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-md">
                <FileCheck className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Task Management</CardTitle>
            </div>
            <Link href="/supervisor-assignments" className="text-xs text-blue-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Task</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-400 hidden sm:table-cell">Assigned</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Status</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-400 hidden md:table-cell">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.tasks.slice(0, 5).map((task) => (
                    <tr key={task.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                          <p className="text-xs text-gray-400">Due {new Date(task.dueDate).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs hidden sm:table-cell">{task.assignedTo}</td>
                      <td className="px-4 py-2.5"><TaskStatusBadge status={task.status} /></td>
                      <td className="px-4 py-2.5 hidden md:table-cell"><TaskPriorityBadge priority={task.priority} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Team Reports */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-50 rounded-md">
                <BarChart3 className="w-4 h-4 text-green-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Team Reports</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/attendance" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Team Attendance</p>
                  <p className="text-xs text-gray-500">View team clock-in/out records</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link href="/leave" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Plane className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Leave Requests</p>
                  <p className="text-xs text-gray-500">Review and manage team leave</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link href="/performance" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Performance Reports</p>
                  <p className="text-xs text-gray-500">Team productivity metrics</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ── Announcements Section ── */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-md">
              <Megaphone className="w-4 h-4 text-indigo-600" />
            </div>
            <CardTitle className="text-sm font-semibold text-gray-700">Quick Announcement</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="Type a quick announcement to your team..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Send className="w-4 h-4 mr-2" />
              Send to Team
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            This will post an announcement visible to all your team members.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
