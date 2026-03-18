"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AttendanceRecord {
  id: string;
  userId: string;
  employeeName: string;
  department: string | null;
  status: string;
  actualIn: string | null;
  actualOut: string | null;
  overtimeMinutes: number;
}

interface AdminStats {
  todayAttendance: AttendanceRecord[];
  clockedInNow: number;
  [key: string]: any;
}

const STATUS_FILTERS = ["All", "Clocked In", "Present"];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Clocked In": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    Present: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    Late: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    Absent: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    "On Leave": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status === "Clocked In" && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
      {status}
    </span>
  );
}

function formatTime(isoStr: string | null) {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function calcHours(inStr: string | null, outStr: string | null) {
  if (!inStr) return "—";
  const start = new Date(inStr).getTime();
  const end = outStr ? new Date(outStr).getTime() : Date.now();
  const mins = Math.floor((end - start) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!outStr) return `${h}h ${m}m ▶`;
  return `${h}h ${m}m`;
}

export function AttendanceClient({ user }: { user: any }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30 seconds to keep live data current
  useEffect(() => {
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, [fetchData]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const records: AttendanceRecord[] = stats?.todayAttendance ?? [];
  const filtered = filter === "All" ? records : records.filter((r) => r.status === filter);

  const clockedInCount = records.filter((r) => r.status === "Clocked In").length;
  const completedCount = records.filter((r) => r.status === "Present").length;
  const totalToday = records.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-500" />
            Attendance Monitoring
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{today}</p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchData} className="flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Today", value: totalToday, color: "text-gray-700 dark:text-gray-200", icon: "📋" },
          { label: "Clocked In Now", value: clockedInCount, color: "text-green-600", icon: "🟢" },
          { label: "Completed Shift", value: completedCount, color: "text-blue-600", icon: "✅" },
          { label: "Clocked In (KPI)", value: stats?.clockedInNow ?? 0, color: "text-purple-600", icon: "⏱️" },
        ].map(({ label, value, color, icon }) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <p className="text-lg mb-1">{icon}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{label}</p>
              {loading ? (
                <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
              ) : (
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {s}
            {s !== "All" && (
              <span className="ml-1.5 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                {s === "Clocked In" ? clockedInCount : completedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            Today's Clock-In Records
            <span className="ml-auto text-xs font-normal text-gray-400">Auto-refreshes every 30s</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Calendar className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">No clock-ins yet today</p>
              <p className="text-xs mt-1 text-gray-400">Employees who clock in will appear here in real-time</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                    {["Employee", "Department", "Status", "Clock In", "Clock Out", "Duration"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rec) => (
                    <tr key={rec.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {rec.employeeName}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{rec.department || "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={rec.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs">
                        {formatTime(rec.actualIn)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                        {formatTime(rec.actualOut)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${rec.actualOut ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"}`}>
                          {calcHours(rec.actualIn, rec.actualOut)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
