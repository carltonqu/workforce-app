"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock, Calendar, TrendingUp, Plane, ClipboardList,
  Activity, DollarSign, User, FileText, Bell, CheckCircle,
  Briefcase, Wallet, AlertCircle, Megaphone, RefreshCw,
  LogIn, LogOut, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Shift {
  id: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  shiftName?: string;
  location?: string;
  isRestDay?: number;
  isHoliday?: number;
}

interface TimeEntry {
  id: string;
  clockIn: string;
  clockOut: string | null;
  totalMinutes?: number;
  overtimeMinutes?: number;
}

interface LeaveBalance {
  leaveType: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

interface Request {
  id: string;
  requestType?: string;
  leaveType?: string;
  status: string;
  createdAt: string;
  details?: string;
  reason?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
}

interface Payslip {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalPay: number;
  status: "draft" | "released";
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: string;
}

interface EmployeeStats {
  totalHoursThisWeek: number;
  totalHoursThisMonth: number;
  overtimeHours: number;
  pendingTasks: number;
  unreadNotifications: number;
  leaveBalance: LeaveBalance[];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_BADGE: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  pending: "bg-gray-100 text-gray-600",
};

export function EmployeeDashboardClient({ user }: { user: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [attendance, setAttendance] = useState<TimeEntry[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, shiftsRes, attRes, leaveRes, reqRes, statusRes] = await Promise.all([
          fetch("/api/employee/profile"),
          fetch(`/api/employee/shifts?from=${today}&to=${weekEnd}`),
          fetch("/api/employee/attendance"),
          fetch("/api/employee/leave-balance"),
          fetch("/api/employee/requests"),
          fetch("/api/time-entries/status"),
        ]);
        if (profileRes.ok) setProfile(await profileRes.json());
        if (shiftsRes.ok) setShifts(await shiftsRes.json());
        if (attRes.ok) setAttendance(await attRes.json());
        if (leaveRes.ok) setLeaveBalances(await leaveRes.json());
        if (reqRes.ok) setRequests(await reqRes.json());
        if (statusRes.ok) {
          const s = await statusRes.json();
          setActiveEntry(s.activeEntry);
        }

        // Mock data for tasks, payslips, and announcements
        setTasks([
          { id: "1", title: "Complete project documentation", description: "Update API docs", dueDate: "2024-04-25", status: "in_progress", priority: "medium" },
          { id: "2", title: "Code review for sprint", description: "Review team PRs", dueDate: "2024-04-24", status: "pending", priority: "high" },
          { id: "3", title: "Weekly team update", description: "Prepare slides", dueDate: "2024-04-26", status: "pending", priority: "low" },
        ]);

        setPayslips([
          { id: "1", periodStart: "2024-04-01", periodEnd: "2024-04-15", totalPay: 25000, status: "released" },
          { id: "2", periodStart: "2024-03-16", periodEnd: "2024-03-31", totalPay: 25000, status: "released" },
        ]);

        setAnnouncements([
          { id: "1", title: "Company Offsite", content: "Join us for the annual company offsite next month!", createdAt: "2024-04-23T10:00:00Z", author: "HR Team" },
          { id: "2", title: "New Benefits Program", content: "We've updated our benefits package. Check the details.", createdAt: "2024-04-22T14:00:00Z", author: "Management" },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [today, weekEnd]);

  const handleClockAction = async () => {
    setClockLoading(true);
    try {
      const endpoint = activeEntry ? "/api/time-entries/clock-out" : "/api/time-entries/clock-in";
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        // Refresh status
        const statusRes = await fetch("/api/time-entries/status");
        if (statusRes.ok) {
          const s = await statusRes.json();
          setActiveEntry(s.activeEntry);
        }
      }
    } finally {
      setClockLoading(false);
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: "completed" as const } : t));
  };

  const todayShift = shifts.find(s => s.date === today);
  const isClockedIn = !!activeEntry;

  // Hours calculations
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekHours = attendance
    .filter(e => new Date(e.clockIn) >= weekStart)
    .reduce((acc, e) => {
      if (e.clockOut) {
        acc += (new Date(e.clockOut).getTime() - new Date(e.clockIn).getTime()) / 3600000;
      }
      return acc;
    }, 0);

  const monthHours = attendance.reduce((acc, e) => {
    if (e.clockOut) {
      acc += (new Date(e.clockOut).getTime() - new Date(e.clockIn).getTime()) / 3600000;
    }
    return acc;
  }, 0);

  const overtimeHours = attendance.reduce((acc, e) => acc + (e.overtimeMinutes || 0) / 60, 0);

  const vacationBalance = leaveBalances.find(l => l.leaveType === "Vacation");
  const sickBalance = leaveBalances.find(l => l.leaveType === "Sick");
  const pendingCount = requests.filter(r => r.status === "Pending").length;
  const pendingTasks = tasks.filter(t => t.status !== "completed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Employee Header Banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {greeting()}, {profile?.fullName || user.name}!
              </h1>
              <p className="text-sm text-emerald-100 mt-0.5">{formatDate(new Date())}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isClockedIn ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/30 rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm">Clocked In</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Not Clocked In</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Clock In/Out Banner ── */}
      <div className={`rounded-xl p-4 flex items-center justify-between ${isClockedIn ? 'bg-green-50 border border-green-200' : 'bg-emerald-50 border border-emerald-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isClockedIn ? 'bg-green-100' : 'bg-emerald-100'}`}>
            {isClockedIn ? (
              <LogOut className="w-5 h-5 text-green-600" />
            ) : (
              <LogIn className="w-5 h-5 text-emerald-600" />
            )}
          </div>
          <div>
            <p className={`font-medium ${isClockedIn ? 'text-green-800' : 'text-emerald-800'}`}>
              {isClockedIn 
                ? `You're clocked in since ${activeEntry ? formatTime(activeEntry.clockIn) : '--:--'}` 
                : "You haven't clocked in today"}
            </p>
            <p className={`text-sm ${isClockedIn ? 'text-green-600' : 'text-emerald-600'}`}>
              {isClockedIn ? "Don't forget to clock out when done!" : "Ready to start your day?"}
            </p>
          </div>
        </div>
        <Button 
          onClick={handleClockAction} 
          disabled={clockLoading}
          className={isClockedIn 
            ? "bg-green-600 hover:bg-green-700 text-white" 
            : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }
        >
          {clockLoading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : isClockedIn ? (
            <LogOut className="w-4 h-4 mr-2" />
          ) : (
            <LogIn className="w-4 h-4 mr-2" />
          )}
          {isClockedIn ? "Clock Out" : "Clock In"}
        </Button>
      </div>

      {/* ── Personal Stats KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Hours This Week</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{weekHours.toFixed(1)}h</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Overtime</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{overtimeHours.toFixed(1)}h</p>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Leave Balance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {vacationBalance ? vacationBalance.remainingDays : "—"}
                </p>
                <p className="text-xs text-gray-400">days remaining</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Plane className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingTasks}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Today's Shift & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2 border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-md">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Today&apos;s Schedule</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {todayShift ? (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-blue-900 text-lg">{todayShift.shiftName || "Regular Shift"}</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    isClockedIn ? "bg-green-100 text-green-700" :
                    new Date() > new Date(`${today}T${todayShift.shiftStart}`) ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {isClockedIn ? "In Progress" :
                      new Date() > new Date(`${today}T${todayShift.shiftStart}`) ? "Not Started" :
                      "Upcoming"}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-800 font-medium">{todayShift.shiftStart} – {todayShift.shiftEnd}</span>
                  </div>
                  {todayShift.location && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <span className="text-sm">📍 {todayShift.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500 font-medium">No shift scheduled today</p>
                <p className="text-sm text-gray-400 mt-1">Enjoy your day off!</p>
              </div>
            )}

            {/* Upcoming Shifts Preview */}
            <div className="mt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Upcoming This Week</p>
              <div className="space-y-2">
                {shifts.filter(s => s.date !== today).slice(0, 3).map(shift => (
                  <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-sm font-semibold text-gray-600">
                        {new Date(shift.date).getDate()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{new Date(shift.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                        <p className="text-xs text-gray-500">{shift.shiftStart} – {shift.shiftEnd}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
                {shifts.filter(s => s.date !== today).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">No upcoming shifts</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 rounded-md">
                <Briefcase className="w-4 h-4 text-emerald-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/clock" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Time Clock</p>
                <p className="text-xs text-gray-500">Clock in or out</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link href="/my-requests" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-purple-50 hover:border-purple-200 border border-transparent transition">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Plane className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Request Leave</p>
                <p className="text-xs text-gray-500">Apply for time off</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link href="/my-payslips" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-green-50 hover:border-green-200 border border-transparent transition">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wallet className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">My Payslips</p>
                <p className="text-xs text-gray-500">View earnings</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link href="/my-profile" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">My Profile</p>
                <p className="text-xs text-gray-500">Update information</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ── My Tasks & Requests Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* My Tasks */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 rounded-md">
                <ClipboardList className="w-4 h-4 text-emerald-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">My Tasks</CardTitle>
            </div>
            <Link href="/my-tasks" className="text-xs text-emerald-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {tasks.map((task) => (
                <div key={task.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <button 
                      onClick={() => handleTaskComplete(task.id)}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                        task.status === "completed" 
                          ? "bg-emerald-500 border-emerald-500" 
                          : "border-gray-300 hover:border-emerald-400"
                      }`}
                    >
                      {task.status === "completed" && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <div>
                      <p className={`text-sm font-medium ${task.status === "completed" ? "text-gray-400 line-through" : "text-gray-800"}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">Due {new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    task.priority === "high" ? "bg-red-100 text-red-700" :
                    task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* My Requests */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 rounded-md">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">My Requests</CardTitle>
            </div>
            <Link href="/my-requests" className="text-xs text-purple-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <ClipboardList className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No requests yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {requests.slice(0, 5).map((r) => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.requestType || r.leaveType || "Request"}</p>
                      <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[r.status] || "bg-gray-100 text-gray-600"}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Leave Balances & Payslips Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Leave Balances */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 rounded-md">
                <Plane className="w-4 h-4 text-purple-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Leave Balances</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {leaveBalances.length > 0 ? leaveBalances.map(lb => (
                <div key={lb.leaveType} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">{lb.leaveType}</p>
                  <p className="text-2xl font-bold text-gray-900">{lb.remainingDays}<span className="text-sm font-normal text-gray-400">/{lb.totalDays}</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">days left</p>
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${lb.totalDays > 0 ? (lb.remainingDays / lb.totalDays) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-6 text-gray-400">
                  <Plane className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No leave balances found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payslips */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-50 rounded-md">
                <Wallet className="w-4 h-4 text-green-600" />
              </div>
              <CardTitle className="text-sm font-semibold text-gray-700">Recent Payslips</CardTitle>
            </div>
            <Link href="/my-payslips" className="text-xs text-green-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {payslips.map((payslip) => (
                <div key={payslip.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(payslip.periodStart).toLocaleDateString('en-US', { month: 'short' })} 1-15
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payslip.periodStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">₱{payslip.totalPay.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      payslip.status === "released" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {payslip.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Company Announcements ── */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-md">
              <Megaphone className="w-4 h-4 text-indigo-600" />
            </div>
            <CardTitle className="text-sm font-semibold text-gray-700">Company Announcements</CardTitle>
          </div>
          <Link href="/announcements" className="text-xs text-indigo-600 hover:underline">View all</Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="px-4 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">{announcement.title}</h4>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{announcement.content}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <span>By {announcement.author}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
