"use client";

import { useState, useEffect } from "react";
import { DollarSign, ChevronDown, ChevronUp } from "lucide-react";

interface PayrollEntry {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  regularHours: number;
  overtimeHours: number;
  basicPay: number;
  overtimePay: number;
  allowances: number;
  grossPay: number;
  sssDeduction: number;
  philhealthDeduction: number;
  pagibigDeduction: number;
  taxDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  total: number;
  status: string;
  notes?: string;
}

function money(n?: number | null) {
  if (n == null) return "₱0.00";
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PayslipDetail({ entry }: { entry: PayrollEntry }) {
  return (
    <div className="border-t border-gray-100 bg-gray-50 px-6 py-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {/* Earnings */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Earnings</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Basic Pay</span>
              <span className="font-medium">{money(entry.basicPay)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Overtime Pay</span>
              <span className="font-medium">{money(entry.overtimePay)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Allowances</span>
              <span className="font-medium">{money(entry.allowances)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1.5">
              <span>Gross Pay</span>
              <span className="text-green-700">{money(entry.grossPay)}</span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Deductions</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">SSS</span>
              <span className="font-medium">{money(entry.sssDeduction)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">PhilHealth</span>
              <span className="font-medium">{money(entry.philhealthDeduction)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pag-IBIG</span>
              <span className="font-medium">{money(entry.pagibigDeduction)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax (BIR)</span>
              <span className="font-medium">{money(entry.taxDeduction)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Other</span>
              <span className="font-medium">{money(entry.otherDeductions)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1.5">
              <span>Total Deductions</span>
              <span className="text-red-600">{money(entry.totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Net */}
        <div className="col-span-2 md:col-span-1 flex flex-col justify-center">
          <div className="bg-blue-600 text-white rounded-xl p-5 text-center">
            <p className="text-sm font-medium opacity-80 mb-1">Net Pay</p>
            <p className="text-3xl font-bold">{money(entry.total)}</p>
          </div>
          {entry.notes && (
            <p className="text-xs text-gray-400 mt-3 text-center italic">{entry.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PayslipCard({ entry }: { entry: PayrollEntry }) {
  const [expanded, setExpanded] = useState(false);

  const periodStart = new Date(entry.periodStart + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const periodEnd = new Date(entry.periodEnd + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">{periodStart} – {periodEnd}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              <span className="text-xs text-gray-500">Regular: {entry.regularHours || 0}h</span>
              <span className="text-xs text-gray-500">Overtime: {entry.overtimeHours || 0}h</span>
              <span className="text-xs text-gray-500">Gross: {money(entry.grossPay)}</span>
              <span className="text-xs text-red-500">Deductions: {money(entry.totalDeductions)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-400">Net Pay</p>
              <p className="text-xl font-bold text-blue-600">{money(entry.total)}</p>
            </div>
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
      {expanded && <PayslipDetail entry={entry} />}
    </div>
  );
}

export function PayslipsClient() {
  const [payslips, setPayslips] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
            <PayslipCard key={p.id} entry={p} />
          ))}
        </div>
      )}
    </div>
  );
}
