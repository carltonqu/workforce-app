"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AttendanceRecord {
  id: string;
  employeeName: string;
  department: string | null;
  status: string;
  actualIn: string | null;
  actualOut: string | null;
  isLate: number;
  lateMinutes: number;
  notes?: string | null;
}

interface AdminStats {
  todayAttendance: AttendanceRecord[];
  lateToday: number;
  absentToday: number;
  clockedInNow: number;
  [key: string]: any;
}

const STATUS_FILTERS = ["All", "Present", "Late", "Absent", "On Leave"];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Present: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    Late: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    Absent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    "On Leave": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        map[status] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
      }`}
    >
      {status}
    </span>
  );
}

export function AttendanceClient({ user }: { user: any }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        setStats(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const records: AttendanceRecord[] = stats?.todayAttendance ?? [];
  const filtered =
    filter === "All"
      ? records
      : records.filter((r) => r.status === filter);

  const presentCount = records.filter((r) => r.status === "Present").length;
  const lateCount = records.filter((r) => r.isLate).length;
  const absentCount = records.filter((r) => r.status === "Absent").length;

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
          { label: "Total Records", value: records.length, color: "text-gray-700 dark:text-gray-200" },
          { label: "Present", value: presentCount, color: "text-green-600" },
          { label: "Late", value: lateCount, color: "text-yellow-600" },
          { label: "Absent", value: absentCount, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>
                {loading ? <span className="inline-block w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /> : value}
              </p>
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
          </button>
        ))}
      </div>

      {/* Main table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Attendance Records
            {filter !== "All" && (
              <span className="ml-2 text-sm font-normal text-gray-500">— {filter}</span>
            )}
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
              <p className="text-sm">No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["Employee", "Dept", "Status", "Clocked In", "Clocked Out", "Late Minutes", "Notes"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rec) => (
                    <tr
                      key={rec.id}
                      className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {rec.employeeName}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{rec.department ?? "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={rec.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{rec.actualIn ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{rec.actualOut ?? "—"}</td>
                      <td className="px-4 py-3">
                        {rec.isLate ? (
                          <span className="text-yellow-600 font-medium">{rec.lateMinutes}m</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{rec.notes ?? "—"}</td>
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
