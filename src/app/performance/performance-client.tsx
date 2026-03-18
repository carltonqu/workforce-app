"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";

interface EmployeePerf {
  userId: string;
  employeeName: string;
  department: string;
  totalShifts: number;
  present: number;
  absent: number;
  lateCount: number;
  earlyCount: number;
  undertimeCount: number;
  avgEarlyMins: number;
  avgLateMins: number;
  performanceScore: number;
  grade: string;
}

type SortKey = "score" | "name" | "department";
type DateRange = 7 | 30 | 90;

function gradeStyle(grade: string): string {
  switch (grade) {
    case "Excellent": return "bg-emerald-100 text-emerald-700";
    case "Very Good": return "bg-blue-100 text-blue-700";
    case "Good": return "bg-indigo-100 text-indigo-700";
    case "Fair": return "bg-yellow-100 text-yellow-700";
    default: return "bg-red-100 text-red-700";
  }
}

function scoreBarColor(grade: string): string {
  switch (grade) {
    case "Excellent": return "bg-emerald-500";
    case "Very Good": return "bg-blue-500";
    case "Good": return "bg-indigo-500";
    case "Fair": return "bg-yellow-500";
    default: return "bg-red-500";
  }
}

function SummaryCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export function PerformanceClient({ user }: { user: any }) {
  const [data, setData] = useState<EmployeePerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<DateRange>(30);
  const [sortBy, setSortBy] = useState<SortKey>("score");

  const fetchData = useCallback(async (d: DateRange) => {
    setLoading(true);
    try {
      const to = new Date().toISOString().slice(0, 10);
      const from = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
      const res = await fetch(`/api/admin/performance?from=${from}&to=${to}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(days); }, [fetchData, days]);

  const sorted = [...data].sort((a, b) => {
    if (sortBy === "name") return a.employeeName.localeCompare(b.employeeName);
    if (sortBy === "department") return a.department.localeCompare(b.department);
    return b.performanceScore - a.performanceScore;
  });

  const avgScore = data.length > 0 ? Math.round(data.reduce((s, e) => s + e.performanceScore, 0) / data.length) : 0;
  const excellentCount = data.filter(e => e.grade === "Excellent").length;
  const goodCount = data.filter(e => e.grade === "Good" || e.grade === "Very Good").length;
  const needsImprovementCount = data.filter(e => e.grade === "Fair" || e.grade === "Poor").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Employee Performance</h1>
            <p className="text-sm text-gray-500">Attendance, punctuality, and undertime tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Last</span>
          {([7, 30, 90] as DateRange[]).map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${days === d ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {d}d
            </button>
          ))}
          <button
            onClick={() => fetchData(days)}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Avg Score" value={`${avgScore}/100`} color="text-gray-900" />
        <SummaryCard label="Excellent" value={excellentCount} color="text-emerald-600" />
        <SummaryCard label="Good / Very Good" value={goodCount} color="text-blue-600" />
        <SummaryCard label="Needs Improvement" value={needsImprovementCount} color="text-red-600" />
      </div>

      {/* Sort + Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <span className="text-sm text-gray-500">Sort by:</span>
          {(["score", "name", "department"] as SortKey[]).map(k => (
            <button
              key={k}
              onClick={() => setSortBy(k)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition capitalize ${sortBy === k ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-50"}`}
            >
              {k}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No performance data found</p>
            <p className="text-sm text-gray-400 mt-1">Assign employee shifts to start tracking</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Employee</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500">Grade</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 min-w-[120px]">Score</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">Shifts</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">Present</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">Absent</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">Late</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">Avg Late</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">Early</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">Avg Early</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500">Undertime</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((emp) => (
                  <tr key={emp.userId} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{emp.employeeName}</p>
                      {emp.department && <p className="text-xs text-gray-400">{emp.department}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${gradeStyle(emp.grade)}`}>
                        {emp.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${scoreBarColor(emp.grade)}`}
                            style={{ width: `${emp.performanceScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-8 text-right">{emp.performanceScore}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700">{emp.totalShifts}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-medium">{emp.present}</td>
                    <td className="py-3 px-4 text-center text-red-500 font-medium">{emp.absent}</td>
                    <td className="py-3 px-4 text-center text-orange-600">{emp.lateCount}</td>
                    <td className="py-3 px-4 text-center text-gray-500">{emp.avgLateMins > 0 ? `${emp.avgLateMins}m` : "—"}</td>
                    <td className="py-3 px-4 text-center text-blue-600">{emp.earlyCount}</td>
                    <td className="py-3 px-4 text-center text-gray-500">{emp.avgEarlyMins > 0 ? `${emp.avgEarlyMins}m` : "—"}</td>
                    <td className="py-3 px-4 text-center text-yellow-600">{emp.undertimeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
