"use client";

import { useState, useEffect } from "react";
import { DollarSign, ChevronDown, ChevronUp, Download } from "lucide-react";

interface PayrollEntry {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  periodType?: string;
  status?: string;
  regularHours: number;
  overtimeHours: number;
  basicPay: number;
  otPay: number;
  nightDiffPay: number;
  holidayPay: number;
  totalAllowances: number;
  allowancesJson?: string;
  grossPay: number;
  sssEmployee: number;
  philhealthEmployee: number;
  pagibigEmployee: number;
  withholdingTax: number;
  lateDeduction: number;
  undertimeDeduction: number;
  absenceDeduction: number;
  totalOtherDeductions: number;
  otherDeductionsJson?: string;
  netPay: number;
  payRate: number;
  // Legacy fallbacks
  total: number;
  deductions: number;
  notes?: string;
}

function money(n?: number | null) {
  if (n == null) return "₱0.00";
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function downloadPayslipPDF(entry: PayrollEntry, userName: string) {
  const fmt = (n?: number | null) => `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const periodStart = new Date(entry.periodStart + "T00:00:00").toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
  const periodEnd = new Date(entry.periodEnd + "T00:00:00").toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });

  const statusBg = entry.status === "RELEASED" ? "#dcfce7" : entry.status === "APPROVED" ? "#dbeafe" : "#f1f5f9";
  const statusColor = entry.status === "RELEASED" ? "#166534" : entry.status === "APPROVED" ? "#1d4ed8" : "#555";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Payslip - ${userName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 32px; }
  .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 16px; }
  .header h1 { font-size: 22px; color: #2563eb; font-weight: bold; }
  .header p { color: #555; margin-top: 4px; }
  .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
  .info div { font-size: 13px; }
  .info strong { display: block; font-size: 11px; color: #888; text-transform: uppercase; margin-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; color: #555; }
  td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
  .amount { text-align: right; font-family: monospace; }
  .section-title { font-weight: bold; font-size: 13px; margin: 16px 0 8px; color: #2563eb; }
  .totals { background: #f8fafc; border-top: 2px solid #2563eb; }
  .totals td { font-weight: bold; }
  .net-pay-box { margin-top: 24px; background: #2563eb; color: white; padding: 20px 24px; border-radius: 8px; text-align: center; }
  .net-pay-box p { font-size: 12px; opacity: 0.8; margin-bottom: 4px; }
  .net-pay-box h2 { font-size: 28px; font-weight: bold; }
  .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
  .two-col { display: flex; gap: 24px; }
  .two-col > div { flex: 1; }
  .status-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; background: ${statusBg}; color: ${statusColor}; }
</style>
</head>
<body>
  <div class="header">
    <h1>PAYSLIP</h1>
    <p>Official Salary Slip</p>
  </div>
  <div class="info">
    <div>
      <strong>Employee</strong>
      ${userName}
    </div>
    <div>
      <strong>Pay Period</strong>
      ${periodStart} – ${periodEnd}
    </div>
    <div>
      <strong>Period Type</strong>
      ${(entry.periodType || "Monthly").replace("_", " ")}
    </div>
    <div>
      <strong>Status</strong>
      <span class="status-badge">${entry.status || "DRAFT"}</span>
    </div>
  </div>
  <div class="two-col">
    <div>
      <div class="section-title">EARNINGS</div>
      <table>
        <tr><td>Basic Pay</td><td class="amount">${fmt(entry.basicPay || (entry.regularHours * (entry.payRate || 0)))}</td></tr>
        ${(entry.otPay || 0) > 0 ? `<tr><td>Overtime Pay</td><td class="amount">${fmt(entry.otPay)}</td></tr>` : ""}
        ${(entry.nightDiffPay || 0) > 0 ? `<tr><td>Night Differential</td><td class="amount">${fmt(entry.nightDiffPay)}</td></tr>` : ""}
        ${(entry.holidayPay || 0) > 0 ? `<tr><td>Holiday Pay</td><td class="amount">${fmt(entry.holidayPay)}</td></tr>` : ""}
        ${(entry.totalAllowances || 0) > 0 ? `<tr><td>Allowances</td><td class="amount">${fmt(entry.totalAllowances)}</td></tr>` : ""}
        <tr class="totals"><td>Gross Pay</td><td class="amount">${fmt(entry.grossPay || entry.total)}</td></tr>
      </table>
    </div>
    <div>
      <div class="section-title">DEDUCTIONS</div>
      <table>
        ${(entry.lateDeduction || 0) > 0 ? `<tr><td>Late</td><td class="amount">– ${fmt(entry.lateDeduction)}</td></tr>` : ""}
        ${(entry.undertimeDeduction || 0) > 0 ? `<tr><td>Undertime</td><td class="amount">– ${fmt(entry.undertimeDeduction)}</td></tr>` : ""}
        ${(entry.absenceDeduction || 0) > 0 ? `<tr><td>Absences</td><td class="amount">– ${fmt(entry.absenceDeduction)}</td></tr>` : ""}
        <tr><td>SSS</td><td class="amount">– ${fmt(entry.sssEmployee)}</td></tr>
        <tr><td>PhilHealth</td><td class="amount">– ${fmt(entry.philhealthEmployee)}</td></tr>
        <tr><td>Pag-IBIG</td><td class="amount">– ${fmt(entry.pagibigEmployee)}</td></tr>
        <tr><td>Withholding Tax</td><td class="amount">– ${fmt(entry.withholdingTax)}</td></tr>
        ${(entry.totalOtherDeductions || 0) > 0 ? `<tr><td>Other Deductions</td><td class="amount">– ${fmt(entry.totalOtherDeductions)}</td></tr>` : ""}
        <tr class="totals"><td>Total Deductions</td><td class="amount">– ${fmt((entry.sssEmployee||0)+(entry.philhealthEmployee||0)+(entry.pagibigEmployee||0)+(entry.withholdingTax||0)+(entry.totalOtherDeductions||0)+(entry.lateDeduction||0)+(entry.undertimeDeduction||0)+(entry.absenceDeduction||0))}</td></tr>
      </table>
    </div>
  </div>
  <div class="net-pay-box">
    <p>NET PAY</p>
    <h2>${fmt(entry.netPay || entry.total)}</h2>
  </div>
  <div class="footer">
    Generated on ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })} · This is a system-generated payslip.
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      win.print();
    };
  }
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const map: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
    APPROVED: { label: "Approved", cls: "bg-blue-100 text-blue-700" },
    RELEASED: { label: "Released", cls: "bg-green-100 text-green-700" },
  };
  const s = map[status] || { label: status, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function PayslipDetail({ entry }: { entry: PayrollEntry }) {
  const totalDeductions =
    (entry.lateDeduction || 0) +
    (entry.undertimeDeduction || 0) +
    (entry.absenceDeduction || 0) +
    (entry.sssEmployee || 0) +
    (entry.philhealthEmployee || 0) +
    (entry.pagibigEmployee || 0) +
    (entry.withholdingTax || 0) +
    (entry.totalOtherDeductions || 0);

  return (
    <div className="border-t border-gray-100 bg-gray-50 px-6 py-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {/* Earnings */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Earnings</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Basic Pay</span>
              <span className="font-medium">{money(entry.basicPay || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">OT Pay</span>
              <span className="font-medium">{money(entry.otPay || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Night Differential</span>
              <span className="font-medium">{money(entry.nightDiffPay || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Holiday Pay</span>
              <span className="font-medium">{money(entry.holidayPay || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Allowances</span>
              <span className="font-medium">{money(entry.totalAllowances || 0)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1.5">
              <span>Gross Pay</span>
              <span className="text-green-700">{money(entry.grossPay || 0)}</span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Deductions</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Late</span>
              <span className="font-medium">{money(entry.lateDeduction || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Undertime</span>
              <span className="font-medium">{money(entry.undertimeDeduction || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Absence</span>
              <span className="font-medium">{money(entry.absenceDeduction || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">SSS</span>
              <span className="font-medium">{money(entry.sssEmployee || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">PhilHealth</span>
              <span className="font-medium">{money(entry.philhealthEmployee || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pag-IBIG</span>
              <span className="font-medium">{money(entry.pagibigEmployee || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax (BIR)</span>
              <span className="font-medium">{money(entry.withholdingTax || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Other</span>
              <span className="font-medium">{money(entry.totalOtherDeductions || 0)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1.5">
              <span>Total Deductions</span>
              <span className="text-red-600">{money(totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Net */}
        <div className="col-span-2 md:col-span-1 flex flex-col justify-center">
          <div className="bg-blue-600 text-white rounded-xl p-5 text-center">
            <p className="text-sm font-medium opacity-80 mb-1">Net Pay</p>
            <p className="text-3xl font-bold">{money(entry.netPay || entry.total)}</p>
          </div>
          {entry.notes && (
            <p className="text-xs text-gray-400 mt-3 text-center italic">{entry.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PayslipCard({ entry, userName }: { entry: PayrollEntry; userName: string }) {
  const [expanded, setExpanded] = useState(false);

  const periodStart = new Date(entry.periodStart + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const periodEnd = new Date(entry.periodEnd + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const totalDeductions =
    (entry.lateDeduction || 0) +
    (entry.undertimeDeduction || 0) +
    (entry.absenceDeduction || 0) +
    (entry.sssEmployee || 0) +
    (entry.philhealthEmployee || 0) +
    (entry.pagibigEmployee || 0) +
    (entry.withholdingTax || 0) +
    (entry.totalOtherDeductions || 0);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-gray-800">{periodStart} – {periodEnd}</p>
              <StatusBadge status={entry.status} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              <span className="text-xs text-gray-500">Regular: {entry.regularHours || 0}h</span>
              <span className="text-xs text-gray-500">Overtime: {entry.overtimeHours || 0}h</span>
              <span className="text-xs text-gray-500">Gross: {money(entry.grossPay || 0)}</span>
              <span className="text-xs text-red-500">Deductions: {money(totalDeductions)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-400">Net Pay</p>
              <p className="text-xl font-bold text-blue-600">{money(entry.netPay || entry.total)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadPayslipPDF(entry, userName)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <Download className="w-3 h-3" />
                PDF
              </button>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? "Hide" : "View Payslip"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {expanded && <PayslipDetail entry={entry} />}
    </div>
  );
}

export function PayslipsClient() {
  const [payslips, setPayslips] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Employee");

  useEffect(() => {
    // Fetch user name from profile
    fetch("/api/employee/profile")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.fullName) setUserName(data.fullName);
      })
      .catch(() => {});

    fetch("/api/payroll")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setPayslips(data);
        else if (data?.entries) setPayslips(data.entries);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <DollarSign className="w-6 h-6 text-blue-600" /> My Payslips
      </h1>

      {payslips.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-12 text-center text-gray-400">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-600">No payslips yet</p>
          <p className="text-sm mt-1">Contact HR for payroll setup.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payslips.map(p => (
            <PayslipCard key={p.id} entry={p} userName={userName} />
          ))}
        </div>
      )}
    </div>
  );
}
