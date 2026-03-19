"use client";

import { useState, useCallback } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle,
  Send,
  Eye,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PayrollBreakdown } from "@/lib/payroll-engine";

// ─── Types ───────────────────────────────────────────────

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
  role: string;
  hasNoAccount?: boolean;
}

interface PayrollEntryRow {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  periodType: string;
  status: string;
  grossPay: number;
  netPay: number;
  sssEmployee: number;
  philhealthEmployee: number;
  pagibigEmployee: number;
  withholdingTax: number;
  totalOtherDeductions: number;
  basicPay: number;
  otPay: number;
  nightDiffPay: number;
  holidayPay: number;
  totalAllowances: number;
  lateDeduction: number;
  undertimeDeduction: number;
  absenceDeduction: number;
  allowancesJson: string;
  otherDeductionsJson: string;
  daysWorked: number;
  hoursWorked: number;
  user?: { name: string; email: string };
}

interface HolidayRow {
  id: string;
  name: string;
  date: string;
  type: string;
}

interface EmployeeProfile {
  email: string;
  branchLocation: string | null;
  department: string | null;
  fullName: string;
}

interface PayrollClientProps {
  employees: EmployeeOption[];
  payrollEntries: PayrollEntryRow[];
  holidays: HolidayRow[];
  employeeProfiles?: EmployeeProfile[];
  currentUserId: string;
  userRole: string;
}

// ─── Helpers ─────────────────────────────────────────────

function fmt(n: number) {
  return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function periodEndDate(start: string, type: string): string {
  const d = new Date(start);
  if (type === "WEEKLY") {
    d.setDate(d.getDate() + 6);
  } else if (type === "SEMI_MONTHLY") {
    if (d.getDate() <= 15) {
      d.setDate(15);
    } else {
      d.setMonth(d.getMonth() + 1, 0); // last day of month
    }
  } else {
    // MONTHLY
    d.setMonth(d.getMonth() + 1, 0);
  }
  return d.toISOString().split("T")[0];
}

function statusBadge(status: string) {
  if (status === "APPROVED") return <Badge className="bg-blue-600 text-white">Approved</Badge>;
  if (status === "RELEASED") return <Badge className="bg-green-600 text-white">Released</Badge>;
  return <Badge variant="outline" className="text-gray-500">Draft</Badge>;
}

// ─── Payslip View ─────────────────────────────────────────

function PayslipView({
  entry,
  employeeName,
}: {
  entry: PayrollEntryRow;
  employeeName: string;
}) {
  let allowances: { name: string; amount: number }[] = [];
  let otherDeds: { name: string; amount: number }[] = [];
  try { allowances = JSON.parse(entry.allowancesJson || "[]"); } catch {}
  try { otherDeds = JSON.parse(entry.otherDeductionsJson || "[]"); }  catch {}

  const totalDeductions =
    entry.lateDeduction +
    entry.undertimeDeduction +
    entry.absenceDeduction +
    entry.sssEmployee +
    entry.philhealthEmployee +
    entry.pagibigEmployee +
    entry.withholdingTax +
    entry.totalOtherDeductions;

  return (
    <div className="font-mono text-sm space-y-4">
      <div className="text-center border-b pb-3">
        <h3 className="text-lg font-bold">PAYSLIP</h3>
        <p className="text-gray-500">{employeeName}</p>
        <p className="text-xs text-gray-400">
          {new Date(entry.periodStart).toLocaleDateString()} — {new Date(entry.periodEnd).toLocaleDateString()} · {entry.periodType}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Earnings */}
        <div className="space-y-1">
          <p className="font-bold text-xs uppercase tracking-wide text-gray-400 mb-2">Earnings</p>
          <PayslipRow label="Basic Pay" value={entry.basicPay} />
          {entry.otPay > 0 && <PayslipRow label="OT Pay" value={entry.otPay} />}
          {entry.nightDiffPay > 0 && <PayslipRow label="Night Differential" value={entry.nightDiffPay} />}
          {entry.holidayPay > 0 && <PayslipRow label="Holiday Pay" value={entry.holidayPay} />}
          {allowances.map((a, i) => (
            <PayslipRow key={i} label={a.name} value={a.amount} />
          ))}
        </div>

        {/* Deductions */}
        <div className="space-y-1">
          <p className="font-bold text-xs uppercase tracking-wide text-gray-400 mb-2">Deductions</p>
          {entry.lateDeduction > 0 && <PayslipRow label="Late" value={entry.lateDeduction} red />}
          {entry.undertimeDeduction > 0 && <PayslipRow label="Undertime" value={entry.undertimeDeduction} red />}
          {entry.absenceDeduction > 0 && <PayslipRow label="Absences" value={entry.absenceDeduction} red />}
          <PayslipRow label="SSS" value={entry.sssEmployee} red />
          <PayslipRow label="PhilHealth" value={entry.philhealthEmployee} red />
          <PayslipRow label="Pag-IBIG" value={entry.pagibigEmployee} red />
          <PayslipRow label="Withholding Tax" value={entry.withholdingTax} red />
          {otherDeds.map((d, i) => (
            <PayslipRow key={i} label={d.name} value={d.amount} red />
          ))}
        </div>
      </div>

      <div className="border-t pt-3 space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Gross Pay</span>
          <span className="font-semibold">{fmt(entry.grossPay)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Total Deductions</span>
          <span className="font-semibold text-red-500">{fmt(totalDeductions)}</span>
        </div>
        <div className="flex justify-between bg-green-50 dark:bg-green-950 rounded-lg px-3 py-2 mt-2">
          <span className="font-bold text-green-700 dark:text-green-400">NET PAY</span>
          <span className="font-bold text-green-700 dark:text-green-400 text-lg">{fmt(entry.netPay)}</span>
        </div>
      </div>
    </div>
  );
}

function PayslipRow({ label, value, red }: { label: string; value: number; red?: boolean }) {
  if (value === 0) return null;
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className={red ? "text-red-500" : ""}>{fmt(value)}</span>
    </div>
  );
}

// ─── Breakdown Preview (used during wizard step 4) ────────

function BreakdownPreview({ bd }: { bd: PayrollBreakdown }) {
  const totalDeductions =
    bd.lateDeduction +
    bd.undertimeDeduction +
    bd.absenceDeduction +
    bd.sssEmployee +
    bd.philhealthEmployee +
    bd.pagibigEmployee +
    bd.withholdingTax +
    bd.totalOtherDeductions;

  return (
    <div className="font-mono text-sm space-y-4">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <p className="font-bold text-xs uppercase tracking-wide text-gray-400 mb-2">Earnings</p>
          <BdRow label="Basic Pay" value={bd.basicPay} />
          {bd.totalOTPay > 0 && <BdRow label="OT Pay" value={bd.totalOTPay} />}
          {bd.nightDiffPay > 0 && <BdRow label="Night Differential" value={bd.nightDiffPay} />}
          {bd.totalHolidayPay > 0 && <BdRow label="Holiday Pay" value={bd.totalHolidayPay} />}
          {bd.allowances.map((a, i) => (
            <BdRow key={i} label={a.name} value={a.amount} />
          ))}
        </div>
        <div className="space-y-1">
          <p className="font-bold text-xs uppercase tracking-wide text-gray-400 mb-2">Deductions</p>
          {bd.lateDeduction > 0 && <BdRow label="Late" value={bd.lateDeduction} red />}
          {bd.undertimeDeduction > 0 && <BdRow label="Undertime" value={bd.undertimeDeduction} red />}
          {bd.absenceDeduction > 0 && <BdRow label="Absences" value={bd.absenceDeduction} red />}
          <BdRow label="SSS" value={bd.sssEmployee} red />
          <BdRow label="PhilHealth" value={bd.philhealthEmployee} red />
          <BdRow label="Pag-IBIG" value={bd.pagibigEmployee} red />
          <BdRow label="Withholding Tax" value={bd.withholdingTax} red />
          {bd.otherDeductions.map((d, i) => (
            <BdRow key={i} label={d.name} value={d.amount} red />
          ))}
        </div>
      </div>
      <div className="border-t pt-3 space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Gross Pay</span>
          <span className="font-semibold">{fmt(bd.grossPay)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Total Deductions</span>
          <span className="font-semibold text-red-500">{fmt(totalDeductions)}</span>
        </div>
        <div className="flex justify-between bg-green-50 dark:bg-green-950 rounded-lg px-3 py-2 mt-2">
          <span className="font-bold text-green-700 dark:text-green-400">NET PAY</span>
          <span className="font-bold text-green-700 dark:text-green-400 text-lg">{fmt(bd.netPay)}</span>
        </div>
      </div>
    </div>
  );
}

function BdRow({ label, value, red }: { label: string; value: number; red?: boolean }) {
  if (value === 0) return null;
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className={red ? "text-red-500" : ""}>{fmt(value)}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────

export function PayrollClient({
  employees,
  payrollEntries: initialEntries,
  holidays: initialHolidays,
  employeeProfiles = [],
  currentUserId,
  userRole,
}: PayrollClientProps) {
  const isAdmin = userRole === "MANAGER" || userRole === "HR";
  const [tab, setTab] = useState<"run" | "history" | "holidays">("run");
  const [entries, setEntries] = useState<PayrollEntryRow[]>(initialEntries);
  const [holidays, setHolidays] = useState<HolidayRow[]>(initialHolidays);

  // ── Employee dropdown filters (Run Payroll step 1) ──
  const [empFilterBranch, setEmpFilterBranch] = useState("");
  const [empFilterDept, setEmpFilterDept] = useState("");

  // ── History filters ──
  const [filterBranch, setFilterBranch] = useState("All");
  const [filterDept, setFilterDept] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // derive unique branches and departments from profiles
  const branches = ["All", ...Array.from(new Set(employeeProfiles.map(p => p.branchLocation).filter(Boolean) as string[]))];
  const departments = ["All", ...Array.from(new Set(employeeProfiles.map(p => p.department).filter(Boolean) as string[]))];

  // ── Run Payroll Wizard ──
  const [step, setStep] = useState(1);
  const [computing, setComputing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [breakdown, setBreakdown] = useState<PayrollBreakdown | null>(null);
  const [computeInput, setComputeInput] = useState<Record<string, unknown> | null>(null);

  // Step 1
  const [selectedUserId, setSelectedUserId] = useState(
    // Pick the first employee that actually has a user account (id !== "")
    isAdmin
      ? (employees.find(e => e.id !== "")?.id ?? currentUserId)
      : currentUserId
  );
  const [periodType, setPeriodType] = useState<"WEEKLY" | "SEMI_MONTHLY" | "MONTHLY">("SEMI_MONTHLY");
  const [periodStart, setPeriodStart] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [periodEnd, setPeriodEnd] = useState(
    periodEndDate(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
      "SEMI_MONTHLY"
    )
  );

  // Step 2 - attendance
  const [attendance, setAttendance] = useState({
    daysWorked: 0,
    hoursWorked: 0,
    lateMinutes: 0,
    undertimeMinutes: 0,
    absenceDays: 0,
    regularOTHours: 0,
    nightDiffHours: 0,
    regularHolidayWorkedHours: 0,
    specialHolidayWorkedHours: 0,
    restDayOTHours: 0,
  });
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);

  // Step 3 - allowances / deductions
  const [allowances, setAllowances] = useState<{ name: string; amount: number }[]>([]);
  const [otherDeductions, setOtherDeductions] = useState<{ name: string; amount: number }[]>([]);

  // History
  const [viewEntry, setViewEntry] = useState<PayrollEntryRow | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  // Holiday form
  const [holidayForm, setHolidayForm] = useState({ name: "", date: "", type: "Regular" });
  const [addingHoliday, setAddingHoliday] = useState(false);

  // ── Step 2: Auto-load attendance ──
  async function loadAttendance() {
    setComputing(true);
    try {
      const res = await fetch("/api/admin/payroll/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          periodType,
          periodStart,
          periodEnd,
          ...attendance,
          allowances,
          otherDeductions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.missingProfile) {
          toast.warning("Employee profile not configured");
        } else {
          toast.error(data.error ?? "Failed to load attendance");
        }
        return;
      }
      if (data.input) {
        setAttendance({
          daysWorked: data.input.daysWorked,
          hoursWorked: data.input.hoursWorked,
          lateMinutes: data.input.lateMinutes,
          undertimeMinutes: data.input.undertimeMinutes,
          absenceDays: data.input.absenceDays,
          regularOTHours: data.input.regularOTHours,
          nightDiffHours: data.input.nightDiffHours,
          regularHolidayWorkedHours: data.input.regularHolidayWorkedHours,
          specialHolidayWorkedHours: data.input.specialHolidayWorkedHours,
          restDayOTHours: data.input.restDayOTHours,
        });
      }
      setAttendanceLoaded(true);
    } catch {
      toast.error("Network error loading attendance");
    } finally {
      setComputing(false);
    }
  }

  // ── Step 4: Compute preview ──
  async function computePreview() {
    setComputing(true);
    try {
      const payload = {
        userId: selectedUserId,
        periodType,
        periodStart,
        periodEnd,
        ...attendance,
        allowances,
        otherDeductions,
      };
      const res = await fetch("/api/admin/payroll/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to compute payroll");
        return;
      }
      setBreakdown(data.breakdown);
      setComputeInput({ ...payload, rateType: data.employee.rateType, rate: data.employee.rate });
      setStep(4);
    } catch {
      toast.error("Network error computing payroll");
    } finally {
      setComputing(false);
    }
  }

  // ── Generate (save) ──
  async function handleGenerate() {
    if (!breakdown || !computeInput) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/payroll/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          periodType,
          periodStart,
          periodEnd,
          rateType: computeInput.rateType,
          rate: computeInput.rate,
          breakdown,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to generate payroll");
        return;
      }
      const entry = await res.json();
      setEntries((prev) => [entry, ...prev]);
      toast.success("Payroll generated!");
      // Reset wizard
      setStep(1);
      setBreakdown(null);
      setAttendanceLoaded(false);
      setTab("history");
    } catch {
      toast.error("Network error generating payroll");
    } finally {
      setGenerating(false);
    }
  }

  // ── Approve ──
  async function handleApprove(id: string) {
    const res = await fetch(`/api/admin/payroll/${id}/approve`, { method: "POST" });
    if (!res.ok) { toast.error("Failed to approve"); return; }
    const updated = await res.json();
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    toast.success("Payroll approved!");
  }

  // ── Release ──
  async function handleRelease(id: string) {
    const res = await fetch(`/api/admin/payroll/${id}/release`, { method: "POST" });
    if (!res.ok) { toast.error("Failed to release"); return; }
    const updated = await res.json();
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    toast.success("Payroll released!");
  }

  // ── Add Holiday ──
  async function handleAddHoliday() {
    if (!holidayForm.name || !holidayForm.date) { toast.warning("Fill all fields"); return; }
    setAddingHoliday(true);
    try {
      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(holidayForm),
      });
      if (!res.ok) { toast.error("Failed to add holiday"); return; }
      const h = await res.json();
      setHolidays((prev) => [...prev, { ...h, date: h.date }]);
      setHolidayForm({ name: "", date: "", type: "Regular" });
      toast.success("Holiday added!");
    } catch {
      toast.error("Network error");
    } finally {
      setAddingHoliday(false);
    }
  }

  // ── Delete Holiday ──
  async function handleDeleteHoliday(id: string) {
    const res = await fetch(`/api/admin/holidays?id=${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    setHolidays((prev) => prev.filter((h) => h.id !== id));
    toast.success("Holiday removed");
  }

  // ─── Attendance field setter ───
  const setAtt = useCallback((key: keyof typeof attendance, val: number) => {
    setAttendance((prev) => ({ ...prev, [key]: val }));
  }, []);

  // ─── Derived values (after all hooks) ─────────────────
  const filteredEmployees = employees.filter((e) => {
    if (!empFilterBranch && !empFilterDept) return true;
    const profile = employeeProfiles?.find(p => p.email === e.email);
    if (empFilterBranch && profile?.branchLocation !== empFilterBranch) return false;
    if (empFilterDept && profile?.department !== empFilterDept) return false;
    return true;
  });

  const selectedEmployee = employees.find(e => e.id === selectedUserId);

  // ─── Render ───────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {(["run", "history", "holidays"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t === "run" ? "Run Payroll" : t === "history" ? "Payroll History" : "Holiday Calendar"}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Run Payroll ── */}
      {tab === "run" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {step === 1 && "Step 1: Select Employee & Period"}
                {step === 2 && "Step 2: Attendance"}
                {step === 3 && "Step 3: Allowances & Deductions"}
                {step === 4 && "Step 4: Payslip Preview"}
              </CardTitle>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      step === s
                        ? "bg-blue-600 text-white"
                        : step > s
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                    }`}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1 */}
            {step === 1 && (
              <>
                {isAdmin && employees.length > 0 && (
                  <div className="space-y-2">
                    {/* Branch / Dept filter for employee dropdown */}
                    <div className="flex gap-2">
                      <select
                        value={empFilterBranch}
                        onChange={(e) => setEmpFilterBranch(e.target.value)}
                        className={selectCls + " flex-1"}
                      >
                        <option value="">All Branches</option>
                        {Array.from(new Set(employeeProfiles.map(p => p.branchLocation).filter(Boolean) as string[])).sort().map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      <select
                        value={empFilterDept}
                        onChange={(e) => setEmpFilterDept(e.target.value)}
                        className={selectCls + " flex-1"}
                      >
                        <option value="">All Departments</option>
                        {Array.from(new Set(employeeProfiles.map(p => p.department).filter(Boolean) as string[])).sort().map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <Field label={`Employee (${filteredEmployees.length} shown)`}>
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className={selectCls}
                      >
                        <option value="">— Select employee —</option>
                        {filteredEmployees.map((e) => (
                          <option key={e.id || e.email} value={e.id} disabled={!e.id}>
                            {e.name}{e.hasNoAccount ? " ⚠ no account" : ""} · {e.email}
                          </option>
                        ))}
                      </select>
                    </Field>
                    {/* Warning if selected employee has no account */}
                    {selectedUserId === "" && filteredEmployees.some(e => !e.id) && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠ Employees marked "no account" need a login account created before payroll can be processed.
                      </p>
                    )}
                    {selectedEmployee?.hasNoAccount && (
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                        ⚠ This employee has no login account yet. Create one in the Employees page first, then payroll can be processed.
                      </div>
                    )}
                  </div>
                )}
                <Field label="Period Type">
                  <select
                    value={periodType}
                    onChange={(e) => {
                      const t = e.target.value as "WEEKLY" | "SEMI_MONTHLY" | "MONTHLY";
                      setPeriodType(t);
                      setPeriodEnd(periodEndDate(periodStart, t));
                    }}
                    className={selectCls}
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="SEMI_MONTHLY">Semi-Monthly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Period Start">
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(e) => {
                        setPeriodStart(e.target.value);
                        setPeriodEnd(periodEndDate(e.target.value, periodType));
                      }}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Period End">
                    <input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={async () => {
                      await loadAttendance();
                      setStep(2);
                    }}
                    disabled={computing}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {computing ? "Loading…" : "Next"} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <>
                {attendanceLoaded && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ Auto-loaded from time entries. Adjust as needed.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <NumField label="Days Worked" value={attendance.daysWorked} onChange={(v) => setAtt("daysWorked", v)} />
                  <NumField label="Hours Worked" value={attendance.hoursWorked} onChange={(v) => setAtt("hoursWorked", v)} />
                  <NumField label="Late (minutes)" value={attendance.lateMinutes} onChange={(v) => setAtt("lateMinutes", v)} />
                  <NumField label="Undertime (minutes)" value={attendance.undertimeMinutes} onChange={(v) => setAtt("undertimeMinutes", v)} />
                  <NumField label="Absent Days" value={attendance.absenceDays} onChange={(v) => setAtt("absenceDays", v)} />
                  <NumField label="Regular OT Hours" value={attendance.regularOTHours} onChange={(v) => setAtt("regularOTHours", v)} />
                  <NumField label="Rest Day OT Hours" value={attendance.restDayOTHours} onChange={(v) => setAtt("restDayOTHours", v)} />
                  <NumField label="Night Differential Hours" value={attendance.nightDiffHours} onChange={(v) => setAtt("nightDiffHours", v)} />
                  <NumField label="Regular Holiday Worked (hrs)" value={attendance.regularHolidayWorkedHours} onChange={(v) => setAtt("regularHolidayWorkedHours", v)} />
                  <NumField label="Special Holiday Worked (hrs)" value={attendance.specialHolidayWorkedHours} onChange={(v) => setAtt("specialHolidayWorkedHours", v)} />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">Allowances</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAllowances((p) => [...p, { name: "", amount: 0 }])}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  {allowances.length === 0 && (
                    <p className="text-xs text-gray-400">No allowances. Click Add.</p>
                  )}
                  {allowances.map((a, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Name (e.g. Transportation)"
                        value={a.name}
                        onChange={(e) =>
                          setAllowances((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                        }
                        className={inputCls + " flex-1"}
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={a.amount || ""}
                        onChange={(e) =>
                          setAllowances((p) =>
                            p.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x))
                          )
                        }
                        className={inputCls + " w-28"}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAllowances((p) => p.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">Other Deductions</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOtherDeductions((p) => [...p, { name: "", amount: 0 }])}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  {otherDeductions.length === 0 && (
                    <p className="text-xs text-gray-400">No additional deductions.</p>
                  )}
                  {otherDeductions.map((d, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Name"
                        value={d.name}
                        onChange={(e) =>
                          setOtherDeductions((p) =>
                            p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))
                          )
                        }
                        className={inputCls + " flex-1"}
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={d.amount || ""}
                        onChange={(e) =>
                          setOtherDeductions((p) =>
                            p.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x))
                          )
                        }
                        className={inputCls + " w-28"}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOtherDeductions((p) => p.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button
                    onClick={computePreview}
                    disabled={computing}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {computing ? "Computing…" : "Preview Payslip"} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </>
            )}

            {/* Step 4 - Preview */}
            {step === 4 && breakdown && (
              <>
                <BreakdownPreview bd={breakdown} />
                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {generating ? "Saving…" : "Generate Payroll"} <Send className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Tab 2: History ── */}
      {tab === "history" && (
        <div className="space-y-4">
          {/* Filters */}
          {isAdmin && (
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className={selectCls}
              >
                {branches.map((b) => <option key={b} value={b}>{b === "All" ? "All Branches" : b}</option>)}
              </select>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className={selectCls}
              >
                {departments.map((d) => <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={selectCls}
              >
                <option value="All">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Approved</option>
                <option value="RELEASED">Released</option>
              </select>
              {(filterBranch !== "All" || filterDept !== "All" || filterStatus !== "All") && (
                <button
                  onClick={() => { setFilterBranch("All"); setFilterDept("All"); setFilterStatus("All"); }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {(() => {
            const filteredEntries = entries.filter((e) => {
              if (filterStatus !== "All" && e.status !== filterStatus) return false;
              if (filterBranch !== "All" || filterDept !== "All") {
                const profile = employeeProfiles.find(p => p.email === e.user?.email);
                if (filterBranch !== "All" && profile?.branchLocation !== filterBranch) return false;
                if (filterDept !== "All" && profile?.department !== filterDept) return false;
              }
              return true;
            });

            if (filteredEntries.length === 0) {
              return (
                <Card>
                  <CardContent className="text-center py-12">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">{entries.length === 0 ? "No payroll entries yet" : "No entries match the selected filters"}</p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b dark:border-gray-700">
                      <th className="pb-2 font-medium">Employee</th>
                      <th className="pb-2 font-medium">Branch</th>
                      <th className="pb-2 font-medium">Period</th>
                      <th className="pb-2 font-medium text-right">Gross Pay</th>
                      <th className="pb-2 font-medium text-right">Deductions</th>
                      <th className="pb-2 font-medium text-right">Net Pay</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredEntries.map((e) => {
                      const profile = employeeProfiles.find(p => p.email === e.user?.email);
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
                        <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-2 font-medium">
                            <div>{e.user?.name ?? "—"}</div>
                            {profile?.department && (
                              <div className="text-xs text-gray-400">{profile.department}</div>
                            )}
                          </td>
                          <td className="py-2 text-xs text-gray-500">{profile?.branchLocation ?? "—"}</td>
                          <td className="py-2 text-gray-500 text-xs">
                            {new Date(e.periodStart).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                            {" – "}
                            {new Date(e.periodEnd).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="py-2 text-right">{fmt(e.grossPay)}</td>
                          <td className="py-2 text-right text-red-500">{fmt(deductions)}</td>
                          <td className="py-2 text-right font-semibold text-green-600">{fmt(e.netPay)}</td>
                          <td className="py-2">{statusBadge(e.status)}</td>
                          <td className="py-2">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setViewEntry(e); setViewOpen(true); }}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              {isAdmin && e.status === "DRAFT" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(e.id)}
                                  className="text-blue-600 border-blue-200"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                              )}
                              {isAdmin && e.status === "APPROVED" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRelease(e.id)}
                                  className="text-green-600 border-green-200"
                                >
                                  <Send className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t dark:border-gray-700 font-semibold text-sm">
                      <td colSpan={3} className="pt-2 text-gray-500">Totals ({filteredEntries.length} entries)</td>
                      <td className="pt-2 text-right">{fmt(filteredEntries.reduce((s, e) => s + e.grossPay, 0))}</td>
                      <td className="pt-2 text-right text-red-500">
                        {fmt(filteredEntries.reduce((s, e) => s + e.sssEmployee + e.philhealthEmployee + e.pagibigEmployee + e.withholdingTax + e.totalOtherDeductions + e.lateDeduction + e.undertimeDeduction + e.absenceDeduction, 0))}
                      </td>
                      <td className="pt-2 text-right text-green-600">{fmt(filteredEntries.reduce((s, e) => s + e.netPay, 0))}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Tab 3: Holidays ── */}
      {tab === "holidays" && (
        <div className="space-y-4">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Add Holiday</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Holiday name"
                    value={holidayForm.name}
                    onChange={(e) => setHolidayForm((p) => ({ ...p, name: e.target.value }))}
                    className={inputCls}
                  />
                  <input
                    type="date"
                    value={holidayForm.date}
                    onChange={(e) => setHolidayForm((p) => ({ ...p, date: e.target.value }))}
                    className={inputCls}
                  />
                  <select
                    value={holidayForm.type}
                    onChange={(e) => setHolidayForm((p) => ({ ...p, type: e.target.value }))}
                    className={selectCls}
                  >
                    <option value="Regular">Regular Holiday</option>
                    <option value="Special">Special Non-Working Day</option>
                  </select>
                </div>
                <Button
                  onClick={handleAddHoliday}
                  disabled={addingHoliday}
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" /> {addingHoliday ? "Adding…" : "Add Holiday"}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4" /> Holidays {new Date().getFullYear()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {holidays.length === 0 ? (
                <p className="text-gray-500 text-sm">No holidays configured.</p>
              ) : (
                <div className="space-y-2">
                  {holidays.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-sm">{h.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(h.date).toLocaleDateString("en-PH", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            h.type === "Regular"
                              ? "border-red-300 text-red-600"
                              : "border-orange-300 text-orange-600"
                          }
                        >
                          {h.type}
                        </Badge>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteHoliday(h.id)}
                            className="text-red-500 border-red-200"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Payslip View Modal ── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payslip Details</DialogTitle>
          </DialogHeader>
          {viewEntry && (
            <PayslipView
              entry={viewEntry}
              employeeName={viewEntry.user?.name ?? "Employee"}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Shared input classes ──────────────────────────────────

const inputCls =
  "border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-full";
const selectCls =
  "border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-full";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={0}
        step={0.01}
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputCls}
      />
    </Field>
  );
}
