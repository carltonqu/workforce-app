"use client";

import { useState, useEffect } from "react";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";

interface TimeEntry {
  id: string;
  clockIn: string;
  clockOut: string | null;
  totalMinutes?: number;
  overtimeMinutes?: number;
  notes?: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function computeHours(entry: TimeEntry): number {
  if (!entry.clockOut) return 0;
  return (new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) / 3600000;
}

function getStatus(entry: TimeEntry): { label: string; cls: string } {
  if (!entry.clockOut) return { label: "In Progress", cls: "bg-blue-100 text-blue-700" };
  const hours = computeHours(entry);
  if (hours >= 8) return { label: "On Time", cls: "bg-green-100 text-green-700" };
  return { label: "Late/Short", cls: "bg-yellow-100 text-yellow-700" };
}

export function AttendanceClient() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetch("/api/employee/attendance")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setEntries(data); })
      .finally(() => setLoading(false));
  }, []);

  function prevMonth() {
    setViewMonth(m => { if (m === 0) { setViewYear(y => y - 1); return 11; } return m - 1; });
  }
  function nextMonth() {
    setViewMonth(m => { if (m === 11) { setViewYear(y => y + 1); return 0; } return m + 1; });
  }

  const filtered = entries.filter(e => {
    const d = new Date(e.clockIn);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });

  const daysPresent = new Set(filtered.map(e => new Date(e.clockIn).toLocaleDateString())).size;
  const daysLate = filtered.filter(e => getStatus(e).label === "Late/Short").length;
  const overtimeHours = filtered.reduce((acc, e) => acc + (e.overtimeMinutes || 0) / 60, 0);
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" /> My Attendance
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700">{monthName}</span>
          <button onClick={nextMonth} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">{daysPresent}</p>
          <p className="text-xs text-gray-500 mt-1">Days Present</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-yellow-600">{daysLate}</p>
          <p className="text-xs text-gray-500 mt-1">Days Late/Short</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-red-500">{Math.max(0, totalDays - daysPresent)}</p>
          <p className="text-xs text-gray-500 mt-1">Absences</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-blue-600">{overtimeHours.toFixed(1)}</p>
          <p className="text-xs text-gray-500 mt-1">Overtime Hours</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No attendance records for {monthName}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Day</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Clock In</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Clock Out</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Hours</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const d = new Date(e.clockIn);
                  const status = getStatus(e);
                  const hours = computeHours(e);
                  return (
                    <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{d.toLocaleDateString("en-US", { weekday: "short" })}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatTime(e.clockIn)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{e.clockOut ? formatTime(e.clockOut) : "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{hours > 0 ? `${hours.toFixed(1)}h` : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
