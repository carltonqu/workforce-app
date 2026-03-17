"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, Clock, DollarSign } from "lucide-react";

interface AttendanceDataPoint {
  date: string;
  hours: number;
  overtime: number;
}

interface LaborCostDataPoint {
  period: string;
  regular: number;
  overtime: number;
  total: number;
}

interface ReportsClientProps {
  attendanceData: AttendanceDataPoint[];
  laborCostData: LaborCostDataPoint[];
}

export function ReportsClient({ attendanceData, laborCostData }: ReportsClientProps) {
  const totalHours = attendanceData.reduce((acc, d) => acc + d.hours, 0);
  const totalOvertime = attendanceData.reduce((acc, d) => acc + d.overtime, 0);
  const totalLaborCost = laborCostData.reduce((acc, d) => acc + d.total, 0);

  const formattedAttendance = attendanceData.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Hours (30d)</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {totalHours.toFixed(1)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950 rounded-lg flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Overtime Hours (30d)</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {totalOvertime.toFixed(1)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-950 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Labor Cost</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${totalLaborCost.toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {formattedAttendance.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <p className="text-sm">No attendance data in the last 30 days</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={formattedAttendance}>
                <defs>
                  <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="overtimeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}h`}
                />
                <Tooltip
                  formatter={(value) => [`${value}h`]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="hours"
                  name="Regular Hours"
                  stroke="#3b82f6"
                  fill="url(#hoursGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="overtime"
                  name="Overtime Hours"
                  stroke="#f97316"
                  fill="url(#overtimeGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Labor Cost Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Labor Cost by Pay Period</CardTitle>
        </CardHeader>
        <CardContent>
          {laborCostData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <p className="text-sm">No payroll data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={laborCostData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(value) => [`$${value}`]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Bar dataKey="regular" name="Regular Pay" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overtime" name="Overtime Pay" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
