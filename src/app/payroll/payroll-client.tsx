"use client";

import { useState } from "react";
import { DollarSign, Plus, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PayrollEntry {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  regularHours: number;
  overtimeHours: number;
  payRate: number;
  deductions: number;
  total: number;
  user?: { name: string; email: string };
}

interface TimeEntry {
  id: string;
  clockIn: string;
  clockOut: string | null;
  overtimeMinutes: number;
}

interface PayrollClientProps {
  payrollEntries: PayrollEntry[];
  timeEntries: TimeEntry[];
  currentUserId: string;
  orgEmployees: { id: string; name: string; email: string; role: string }[];
  userRole: string;
}

export function PayrollClient({
  payrollEntries: initialEntries,
  timeEntries,
  currentUserId,
  orgEmployees,
  userRole,
}: PayrollClientProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    employeeId: currentUserId,
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10),
    payRate: 25,
    deductions: 0,
  });

  // Auto-calculate from time entries
  function calculateFromTimeEntries(employeeId: string, start: string, end: string) {
    const periodStart = new Date(start);
    const periodEnd = new Date(end);

    const relevant = timeEntries.filter((t) => {
      const d = new Date(t.clockIn);
      return d >= periodStart && d <= periodEnd;
    });

    const totalMinutes = relevant.reduce((acc, t) => {
      if (!t.clockOut) return acc;
      return acc + Math.floor((new Date(t.clockOut).getTime() - new Date(t.clockIn).getTime()) / 60000);
    }, 0);

    const overtimeMinutes = relevant.reduce((acc, t) => acc + t.overtimeMinutes, 0);
    const regularMinutes = totalMinutes - overtimeMinutes;

    return {
      regularHours: Math.round((regularMinutes / 60) * 10) / 10,
      overtimeHours: Math.round((overtimeMinutes / 60) * 10) / 10,
    };
  }

  async function handleGenerate() {
    const { regularHours, overtimeHours } = calculateFromTimeEntries(
      form.employeeId,
      form.periodStart,
      form.periodEnd
    );

    const regularPay = regularHours * form.payRate;
    const overtimePay = overtimeHours * form.payRate * 1.5;
    const total = regularPay + overtimePay - form.deductions;

    setGenerating(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: form.employeeId,
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          regularHours,
          overtimeHours,
          payRate: form.payRate,
          deductions: form.deductions,
          total,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate payroll");
      const entry = await res.json();
      setEntries((prev) => [entry, ...prev]);
      setDialogOpen(false);
      toast.success("Payroll entry generated!");
    } catch {
      toast.error("Failed to generate payroll.");
    } finally {
      setGenerating(false);
    }
  }

  const totalPaid = entries.reduce((acc, e) => acc + e.total, 0);
  const totalRegularHours = entries.reduce((acc, e) => acc + e.regularHours, 0);
  const totalOvertimeHours = entries.reduce((acc, e) => acc + e.overtimeHours, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-950 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Paid</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  ${totalPaid.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Regular Hours</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {totalRegularHours.toFixed(1)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Overtime Hours</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {totalOvertimeHours.toFixed(1)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header + Generate Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Payroll History
        </h2>
        {(userRole === "MANAGER" || userRole === "HR") && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium">
                <Plus className="w-4 h-4" />
                Generate Payroll
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Payroll Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {orgEmployees.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Employee
                    </label>
                    <select
                      value={form.employeeId}
                      onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                    >
                      {orgEmployees.map((e) => (
                        <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Period Start
                    </label>
                    <input
                      type="date"
                      value={form.periodStart}
                      onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Period End
                    </label>
                    <input
                      type="date"
                      value={form.periodEnd}
                      onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      value={form.payRate}
                      onChange={(e) => setForm({ ...form, payRate: Number(e.target.value) })}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Deductions ($)
                    </label>
                    <input
                      type="number"
                      value={form.deductions}
                      onChange={(e) => setForm({ ...form, deductions: Number(e.target.value) })}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {generating ? "Generating..." : "Generate Payroll"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Payroll Table */}
      {entries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No payroll entries yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(entry.periodStart).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      —{" "}
                      {new Date(entry.periodEnd).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {entry.user && (
                      <p className="text-sm text-gray-500">{entry.user.name}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <span className="text-sm text-gray-500">
                      {entry.regularHours}h reg + {entry.overtimeHours}h OT
                    </span>
                    <span className="text-sm text-gray-500">
                      ${entry.payRate}/hr
                    </span>
                    {entry.deductions > 0 && (
                      <Badge variant="outline" className="text-red-500 border-red-200">
                        -${entry.deductions} deductions
                      </Badge>
                    )}
                    <span className="font-bold text-lg text-green-600">
                      ${entry.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
