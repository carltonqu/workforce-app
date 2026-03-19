"use client";

import { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
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
import { Button } from "@/components/ui/button";
import {
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  Building2,
  AlertCircle,
  Download,
  Printer,
  Search,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PayrollEntryData {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  periodType: string;
  status: string;
  basicPay: number;
  otPay: number;
  nightDiffPay: number;
  holidayPay: number;
  totalAllowances: number;
  allowancesJson: string;
  grossPay: number;
  sssEmployee: number;
  philhealthEmployee: number;
  pagibigEmployee: number;
  withholdingTax: number;
  sssEmployer: number;
  philhealthEmployer: number;
  pagibigEmployer: number;
  totalOtherDeductions: number;
  netPay: number;
  lateDeduction: number;
  undertimeDeduction: number;
  absenceDeduction: number;
  regularHours: number;
  overtimeHours: number;
  payRate: number;
  deductions: number;
  total: number;
  user?: { name: string; email: string };
}

interface EmployeeData {
  id: string;
  employeeId: string;
  fullName: string;
  department: string | null;
  branchLocation: string | null;
  employmentType: string | null;
  salaryRate: number | null;
  email: string;
}

interface FinanceClientProps {
  payrollEntries: PayrollEntryData[];
  employees: EmployeeData[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function sumField(arr: PayrollEntryData[], key: keyof PayrollEntryData): number {
  return arr.reduce((acc, e) => acc + ((e[key] as number) || 0), 0);
}

function sumFn(arr: PayrollEntryData[], fn: (e: PayrollEntryData) => number): number {
  return arr.reduce((acc, e) => acc + (fn(e) || 0), 0);
}

function exportCSV(data: PayrollEntryData[], employees: EmployeeData[]) {
  const rows = data.map((e) => {
    const emp = employees.find((em) => em.email === e.user?.email);
    return [
      `"${e.user?.name || ""}"`,
      `"${emp?.department || ""}"`,
      `"${emp?.branchLocation || ""}"`,
      `"${new Date(e.periodStart).toLocaleDateString()}"`,
      `"${new Date(e.periodEnd).toLocaleDateString()}"`,
      e.basicPay || e.regularHours * e.payRate,
      e.otPay,
      e.nightDiffPay,
      e.holidayPay,
      e.totalAllowances,
      e.grossPay || e.total,
      e.sssEmployee + e.philhealthEmployee + e.pagibigEmployee + e.withholdingTax,
      e.netPay || e.total,
      `"${e.status}"`,
    ].join(",");
  });
  const header =
    "Employee,Department,Branch,Period Start,Period End,Basic Pay,OT Pay,Night Diff,Holiday Pay,Allowances,Gross Pay,Deductions,Net Pay,Status";
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `finance-summary-${new Date().toISOString().slice(0, 7)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PIE_COLORS = ["#3b82f6", "#f97316", "#8b5cf6", "#10b981", "#f59e0b"];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  APPROVED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  RELEASED: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="dark:bg-gray-900">
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
              {title}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 truncate">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className={`p-2 rounded-lg flex-shrink-0 ml-3 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FinanceClient({ payrollEntries, employees }: FinanceClientProps) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [detailTab, setDetailTab] = useState<"department" | "branch" | "employee">("department");
  const [employeeSearch, setEmployeeSearch] = useState("");

  // Unique departments and branches
  const departments = useMemo(() => {
    const depts = new Set(employees.map((e) => e.department).filter(Boolean) as string[]);
    return ["All", ...Array.from(depts).sort()];
  }, [employees]);

  const branches = useMemo(() => {
    const brs = new Set(employees.map((e) => e.branchLocation).filter(Boolean) as string[]);
    return ["All", ...Array.from(brs).sort()];
  }, [employees]);

  // Filtered entries
  const filtered = useMemo(() => {
    return payrollEntries.filter((entry) => {
      const entryMonth = new Date(entry.periodStart).toISOString().slice(0, 7);
      if (selectedMonth && entryMonth !== selectedMonth) return false;
      if (selectedStatus !== "All" && entry.status !== selectedStatus) return false;
      const emp = employees.find((e) => e.email === entry.user?.email);
      if (selectedDepartment !== "All" && emp?.department !== selectedDepartment) return false;
      if (selectedBranch !== "All" && emp?.branchLocation !== selectedBranch) return false;
      return true;
    });
  }, [payrollEntries, employees, selectedMonth, selectedDepartment, selectedBranch, selectedStatus]);

  // Totals
  const totals = useMemo(() => {
    const basicPay =
      sumField(filtered, "basicPay") ||
      sumFn(filtered, (e) => e.regularHours * e.payRate);
    const grossPay = sumFn(filtered, (e) => e.grossPay || e.total);
    const netPay = sumFn(filtered, (e) => e.netPay || e.total);
    const sssEmployee = sumField(filtered, "sssEmployee");
    const philhealthEmployee = sumField(filtered, "philhealthEmployee");
    const pagibigEmployee = sumField(filtered, "pagibigEmployee");
    const withholdingTax = sumField(filtered, "withholdingTax");
    const sssEmployer = sumField(filtered, "sssEmployer");
    const philhealthEmployer = sumField(filtered, "philhealthEmployer");
    const pagibigEmployer = sumField(filtered, "pagibigEmployer");
    const lateDeduction = sumField(filtered, "lateDeduction");
    const undertimeDeduction = sumField(filtered, "undertimeDeduction");
    const absenceDeduction = sumField(filtered, "absenceDeduction");
    const totalOtherDeductions = sumField(filtered, "totalOtherDeductions");

    const totalDeductions = sumFn(
      filtered,
      (e) =>
        e.sssEmployee +
        e.philhealthEmployee +
        e.pagibigEmployee +
        e.withholdingTax +
        e.totalOtherDeductions +
        e.lateDeduction +
        e.undertimeDeduction +
        e.absenceDeduction
    );
    const employerContributions = sssEmployer + philhealthEmployer + pagibigEmployer;
    const totalCompanyCost = sumFn(
      filtered,
      (e) => (e.grossPay || e.total) + e.sssEmployer + e.philhealthEmployer + e.pagibigEmployer
    );

    return {
      employeeCount: new Set(filtered.map((e) => e.userId)).size,
      basicPay,
      otPay: sumField(filtered, "otPay"),
      nightDiffPay: sumField(filtered, "nightDiffPay"),
      holidayPay: sumField(filtered, "holidayPay"),
      allowances: sumField(filtered, "totalAllowances"),
      grossPay,
      sssEmployee,
      philhealthEmployee,
      pagibigEmployee,
      withholdingTax,
      lateDeduction,
      undertimeDeduction,
      absenceDeduction,
      totalOtherDeductions,
      totalDeductions,
      netPay,
      sssEmployer,
      philhealthEmployer,
      pagibigEmployer,
      employerContributions,
      totalCompanyCost,
    };
  }, [filtered]);

  // Last 6 months trend data
  const trendData = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: d.toISOString().slice(0, 7),
        label: MONTH_LABELS[d.getMonth()],
      });
    }
    return months.map(({ key, label }) => {
      const monthEntries = payrollEntries.filter(
        (e) => new Date(e.periodStart).toISOString().slice(0, 7) === key
      );
      return {
        month: label,
        gross: Math.round(sumFn(monthEntries, (e) => e.grossPay || e.total)),
        net: Math.round(sumFn(monthEntries, (e) => e.netPay || e.total)),
      };
    });
  }, [payrollEntries]);

  // Pie chart data
  const pieData = useMemo(() => {
    const data = [
      { name: "Basic Salary", value: Math.round(totals.basicPay) },
      { name: "Overtime Pay", value: Math.round(totals.otPay) },
      { name: "Night Differential", value: Math.round(totals.nightDiffPay) },
      { name: "Holiday Pay", value: Math.round(totals.holidayPay) },
      { name: "Allowances", value: Math.round(totals.allowances) },
    ];
    return data.filter((d) => d.value > 0);
  }, [totals]);

  // By Department grouping
  const byDepartment = useMemo(() => {
    const map = new Map<
      string,
      {
        department: string;
        employeeIds: Set<string>;
        basicPay: number;
        otPay: number;
        allowances: number;
        deductions: number;
        netPay: number;
      }
    >();
    filtered.forEach((e) => {
      const emp = employees.find((em) => em.email === e.user?.email);
      const dept = emp?.department || "Unknown";
      if (!map.has(dept)) {
        map.set(dept, {
          department: dept,
          employeeIds: new Set(),
          basicPay: 0,
          otPay: 0,
          allowances: 0,
          deductions: 0,
          netPay: 0,
        });
      }
      const row = map.get(dept)!;
      row.employeeIds.add(e.userId);
      row.basicPay += e.basicPay || e.regularHours * e.payRate;
      row.otPay += e.otPay;
      row.allowances += e.totalAllowances;
      row.deductions +=
        e.sssEmployee +
        e.philhealthEmployee +
        e.pagibigEmployee +
        e.withholdingTax +
        e.totalOtherDeductions +
        e.lateDeduction +
        e.undertimeDeduction +
        e.absenceDeduction;
      row.netPay += e.netPay || e.total;
    });
    return Array.from(map.values()).sort((a, b) => a.department.localeCompare(b.department));
  }, [filtered, employees]);

  // By Branch grouping
  const byBranch = useMemo(() => {
    const map = new Map<
      string,
      {
        branch: string;
        employeeIds: Set<string>;
        basicPay: number;
        otPay: number;
        allowances: number;
        deductions: number;
        netPay: number;
      }
    >();
    filtered.forEach((e) => {
      const emp = employees.find((em) => em.email === e.user?.email);
      const branch = emp?.branchLocation || "Unknown";
      if (!map.has(branch)) {
        map.set(branch, {
          branch,
          employeeIds: new Set(),
          basicPay: 0,
          otPay: 0,
          allowances: 0,
          deductions: 0,
          netPay: 0,
        });
      }
      const row = map.get(branch)!;
      row.employeeIds.add(e.userId);
      row.basicPay += e.basicPay || e.regularHours * e.payRate;
      row.otPay += e.otPay;
      row.allowances += e.totalAllowances;
      row.deductions +=
        e.sssEmployee +
        e.philhealthEmployee +
        e.pagibigEmployee +
        e.withholdingTax +
        e.totalOtherDeductions +
        e.lateDeduction +
        e.undertimeDeduction +
        e.absenceDeduction;
      row.netPay += e.netPay || e.total;
    });
    return Array.from(map.values()).sort((a, b) => a.branch.localeCompare(b.branch));
  }, [filtered, employees]);

  // Searched employee entries
  const filteredEmployeeRows = useMemo(() => {
    if (!employeeSearch.trim()) return filtered;
    const q = employeeSearch.toLowerCase();
    return filtered.filter((e) => {
      const emp = employees.find((em) => em.email === e.user?.email);
      return (
        (e.user?.name || "").toLowerCase().includes(q) ||
        (emp?.department || "").toLowerCase().includes(q) ||
        (emp?.branchLocation || "").toLowerCase().includes(q)
      );
    });
  }, [filtered, employees, employeeSearch]);

  const detailTabClass = (tab: typeof detailTab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      detailTab === tab
        ? "bg-blue-600 text-white"
        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance Summary</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monthly payroll cost, salary obligations, and payment reports.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === "All" ? "All Departments" : d}
              </option>
            ))}
          </select>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {branches.map((b) => (
              <option key={b} value={b}>
                {b === "All" ? "All Branches" : b}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {["All", "DRAFT", "APPROVED", "RELEASED"].map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Statuses" : s}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV(filtered, employees)}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </div>
      </div>

      {/* ─── Section 1: Summary Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Employees"
          value={totals.employeeCount.toString()}
          icon={Users}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
        />
        <SummaryCard
          title="Gross Payroll"
          value={fmt(totals.grossPay)}
          icon={DollarSign}
          color="bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
        />
        <SummaryCard
          title="Net Payroll"
          value={fmt(totals.netPay)}
          icon={TrendingUp}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300"
        />
        <SummaryCard
          title="Total Overtime Pay"
          value={fmt(totals.otPay)}
          icon={Clock}
          color="bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300"
        />
        <SummaryCard
          title="Total Allowances"
          value={fmt(totals.allowances)}
          icon={Building2}
          color="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
        />
        <SummaryCard
          title="Total Deductions"
          value={fmt(totals.totalDeductions)}
          icon={AlertCircle}
          color="bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
        />
        <SummaryCard
          title="Employer Contributions"
          value={fmt(totals.employerContributions)}
          icon={Users}
          color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
          subtitle="SSS + PhilHealth + Pag-IBIG"
        />
        <SummaryCard
          title="Total Company Cost"
          value={fmt(totals.totalCompanyCost)}
          icon={DollarSign}
          color="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
          subtitle="Gross + Employer contributions"
        />
      </div>

      {/* ─── Section 2: Payment Obligation ──────────────────────────────────── */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 dark:bg-gray-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            This Month&apos;s Payment Obligation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">Net Salary to Employees</span>
              <span className="font-semibold text-gray-900 dark:text-white">{fmt(totals.netPay)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Government Contributions{" "}
                <span className="text-xs text-gray-400">(employer side)</span>
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {fmt(totals.employerContributions)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">Other Payables</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {fmt(totals.totalOtherDeductions)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 bg-blue-50 dark:bg-blue-950 rounded-lg px-4">
              <span className="font-bold text-blue-900 dark:text-blue-200 text-base">
                Total Cash Out Required
              </span>
              <span className="font-bold text-blue-900 dark:text-blue-200 text-xl">
                {fmt(totals.totalCompanyCost)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Section 3: Summary Table + Charts ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary Table */}
        <Card className="dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Payroll Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  { label: "Basic Salary", value: totals.basicPay, bold: false },
                  { label: "Overtime Pay", value: totals.otPay, bold: false },
                  { label: "Night Differential", value: totals.nightDiffPay, bold: false },
                  { label: "Holiday Pay", value: totals.holidayPay, bold: false },
                  { label: "Allowances", value: totals.allowances, bold: false },
                  { label: "Gross Payroll", value: totals.grossPay, bold: true, divider: true },
                  { label: "Employee Deductions", value: -totals.totalDeductions, bold: false, negative: true },
                  { label: "Net Payroll", value: totals.netPay, bold: true, divider: true },
                  { label: "Employer Contributions", value: totals.employerContributions, bold: false },
                  { label: "Total Company Payroll Cost", value: totals.totalCompanyCost, bold: true, divider: true },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className={row.divider ? "border-t-2 border-gray-300 dark:border-gray-600" : ""}
                  >
                    <td
                      className={`py-2 text-gray-${row.bold ? "900" : "600"} dark:text-gray-${row.bold ? "white" : "400"} ${row.bold ? "font-semibold" : ""}`}
                    >
                      {row.label}
                    </td>
                    <td
                      className={`py-2 text-right ${row.bold ? "font-bold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"} ${row.negative ? "text-red-600 dark:text-red-400" : ""}`}
                    >
                      {row.negative
                        ? `(${fmt(Math.abs(row.value))})`
                        : fmt(row.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Payroll Composition Pie */}
        <Card className="dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Payroll Composition</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No data for selected period
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                  {pieData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <span
                        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      {item.name}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card className="dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Monthly Payroll Trend (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trendData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(v: number) => `₱${(v / 1000).toFixed(0)}K`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              <Legend />
              <Bar dataKey="gross" name="Gross Pay" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net" name="Net Pay" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ─── Section 5: Detailed Tables ──────────────────────────────────────── */}
      <Card className="dark:bg-gray-900">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base font-semibold">Detailed Breakdown</CardTitle>
            <div className="flex gap-1">
              <button onClick={() => setDetailTab("department")} className={detailTabClass("department")}>
                By Department
              </button>
              <button onClick={() => setDetailTab("branch")} className={detailTabClass("branch")}>
                By Branch
              </button>
              <button onClick={() => setDetailTab("employee")} className={detailTabClass("employee")}>
                By Employee
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {detailTab === "department" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {["Department", "Employees", "Basic Pay", "OT Pay", "Allowances", "Deductions", "Net Pay"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {byDepartment.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-400 text-sm">
                        No payroll data for this period
                      </td>
                    </tr>
                  ) : (
                    byDepartment.map((row) => (
                      <tr key={row.department} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">{row.department}</td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{row.employeeIds.size}</td>
                        <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{fmt(row.basicPay)}</td>
                        <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{fmt(row.otPay)}</td>
                        <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{fmt(row.allowances)}</td>
                        <td className="py-2 px-3 text-red-600 dark:text-red-400">({fmt(row.deductions)})</td>
                        <td className="py-2 px-3 font-semibold text-gray-900 dark:text-white">{fmt(row.netPay)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === "branch" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {["Branch", "Employees", "Basic Pay", "OT Pay", "Allowances", "Deductions", "Net Pay"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {byBranch.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-400 text-sm">
                        No payroll data for this period
                      </td>
                    </tr>
                  ) : (
                    byBranch.map((row) => (
                      <tr key={row.branch} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">{row.branch}</td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{row.employeeIds.size}</td>
                        <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{fmt(row.basicPay)}</td>
                        <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{fmt(row.otPay)}</td>
                        <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{fmt(row.allowances)}</td>
                        <td className="py-2 px-3 text-red-600 dark:text-red-400">({fmt(row.deductions)})</td>
                        <td className="py-2 px-3 font-semibold text-gray-900 dark:text-white">{fmt(row.netPay)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === "employee" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employee, department, branch..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {[
                        "Employee",
                        "Department",
                        "Period",
                        "Basic Pay",
                        "OT",
                        "ND",
                        "Holiday",
                        "Allowances",
                        "Deductions",
                        "Net Pay",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left py-2 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredEmployeeRows.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-6 text-center text-gray-400 text-sm">
                          No payroll entries found
                        </td>
                      </tr>
                    ) : (
                      filteredEmployeeRows.map((e) => {
                        const emp = employees.find((em) => em.email === e.user?.email);
                        const deductions =
                          e.sssEmployee +
                          e.philhealthEmployee +
                          e.pagibigEmployee +
                          e.withholdingTax +
                          e.totalOtherDeductions +
                          e.lateDeduction +
                          e.undertimeDeduction +
                          e.absenceDeduction;
                        return (
                          <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-2 px-2 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                              {e.user?.name || "—"}
                            </td>
                            <td className="py-2 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              {emp?.department || "—"}
                            </td>
                            <td className="py-2 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              {new Date(e.periodStart).toLocaleDateString("en-PH", {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              –{" "}
                              {new Date(e.periodEnd).toLocaleDateString("en-PH", {
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="py-2 px-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {fmt(e.basicPay || e.regularHours * e.payRate)}
                            </td>
                            <td className="py-2 px-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {fmt(e.otPay)}
                            </td>
                            <td className="py-2 px-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {fmt(e.nightDiffPay)}
                            </td>
                            <td className="py-2 px-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {fmt(e.holidayPay)}
                            </td>
                            <td className="py-2 px-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {fmt(e.totalAllowances)}
                            </td>
                            <td className="py-2 px-2 text-red-600 dark:text-red-400 whitespace-nowrap">
                              ({fmt(deductions)})
                            </td>
                            <td className="py-2 px-2 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                              {fmt(e.netPay || e.total)}
                            </td>
                            <td className="py-2 px-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  STATUS_COLORS[e.status] || STATUS_COLORS.DRAFT
                                }`}
                              >
                                {e.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print styles */}
      <style>{`
        @media print {
          aside, nav, button, input[type="month"], select { display: none !important; }
          .space-y-6 { gap: 1rem; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
