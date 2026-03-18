"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock, Calendar, TrendingUp, Plane, ClipboardList,
  Activity, DollarSign, User, FileText, Bell,
} from "lucide-react";

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
};

export function EmployeeDashboardClient({ user }: { user: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [attendance, setAttendance] = useState<TimeEntry[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [today, weekEnd]);

  const todayShift = shifts.find(s => s.date === today);
  const isClockedIn = !!activeEntry;

  // Hours this week
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

  const vacationBalance = leaveBalances.find(l => l.leaveType === "Vacation");
  const pendingCount = requests.filter(r => r.status === "Pending").length;
  const recentRequests = requests.slice(0, 5);

  const quickActions = [
    { href: "/clock", label: isClockedIn ? "Clock Out" : "Clock In", icon: Clock, color: "text-blue-600 bg-blue-50" },
    { href: "/my-schedule", label: "My Schedule", icon: Calendar, color: "text-purple-600 bg-purple-50" },
    { href: "/my-requests", label: "Request Leave", icon: Plane, color: "text-green-600 bg-green-50" },
    { href: "/my-attendance", label: "Attendance History", icon: Activity, color: "text-indigo-600 bg-indigo-50" },
    { href: "/my-payslips", label: "My Payslips", icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
    { href: "/my-profile", label: "My Profile", icon: User, color: "text-gray-600 bg-gray-50" },
    { href: "/my-requests", label: "Submit Request", icon: FileText, color: "text-orange-600 bg-orange-50" },
    { href: "/notifications", label: "Notifications", icon: Bell, color: "text-red-600 bg-red-50" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting()}, {profile?.fullName || user.name}! 👋
        </h1>
        <p className="text-gray-500 mt-1">{formatDate(new Date())}</p>
      </div>

      {/* Status banner */}
      {isClockedIn ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-800 font-medium">
            You&apos;re clocked in · Since {formatTime(activeEntry!.clockIn)}
          </span>
          <Link href="/clock" className="ml-auto text-sm text-green-700 underline">Manage</Link>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-blue-800 font-medium">You haven&apos;t clocked in today</span>
          <Link href="/clock" className="ml-auto text-sm text-blue-700 underline font-medium">Clock In</Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg"><Clock className="w-4 h-4 text-blue-600" /></div>
            <span className="text-xs text-gray-500 font-medium">Today&apos;s Shift</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm">
            {todayShift
              ? `${todayShift.shiftStart} – ${todayShift.shiftEnd}`
              : "No shift today"}
          </p>
          {todayShift?.shiftName && <p className="text-xs text-gray-500 mt-0.5">{todayShift.shiftName}</p>}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-50 rounded-lg"><TrendingUp className="w-4 h-4 text-green-600" /></div>
            <span className="text-xs text-gray-500 font-medium">Hours This Week</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{weekHours.toFixed(1)} hrs</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg"><Plane className="w-4 h-4 text-purple-600" /></div>
            <span className="text-xs text-gray-500 font-medium">Leave Balance</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm">
            {vacationBalance ? `${vacationBalance.remainingDays}/${vacationBalance.totalDays} days` : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Vacation</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-orange-50 rounded-lg"><ClipboardList className="w-4 h-4 text-orange-600" /></div>
            <span className="text-xs text-gray-500 font-medium">Pending Requests</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm">{pendingCount}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href + action.label} href={action.href}
                className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-blue-100 transition group">
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-center text-gray-600 group-hover:text-gray-900 font-medium leading-tight">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Today's Schedule + My Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Today&apos;s Schedule</h2>
          {todayShift ? (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-blue-900">{todayShift.shiftName || "Regular Shift"}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isClockedIn ? "bg-green-100 text-green-700" :
                  new Date() > new Date(`${today}T${todayShift.shiftStart}`) ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {isClockedIn ? "In Progress" :
                    new Date() > new Date(`${today}T${todayShift.shiftStart}`) ? "Not Started" :
                    "Upcoming"}
                </span>
              </div>
              <p className="text-blue-800 text-sm font-medium">{todayShift.shiftStart} – {todayShift.shiftEnd}</p>
              {todayShift.location && <p className="text-blue-600 text-xs mt-1">📍 {todayShift.location}</p>}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No shift scheduled today</p>
            </div>
          )}
        </div>

        {/* My Requests */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">My Requests</h2>
            <Link href="/my-requests" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {recentRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No requests yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentRequests.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
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
        </div>
      </div>

      {/* Leave Balances */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Leave Balances</h2>
        <div className="flex flex-wrap gap-3">
          {leaveBalances.map(lb => (
            <div key={lb.leaveType} className="flex-1 min-w-[140px] bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">{lb.leaveType}</p>
              <p className="text-lg font-bold text-gray-900">{lb.remainingDays}<span className="text-sm font-normal text-gray-400">/{lb.totalDays}</span></p>
              <p className="text-xs text-gray-400">days remaining</p>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${lb.totalDays > 0 ? (lb.remainingDays / lb.totalDays) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
