"use client";

import { useState, useEffect } from "react";
import { Plane, Plus, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface LeaveBalance {
  leaveType: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

interface LeaveRequest {
  id: string;
  leaveType?: string;
  requestType?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  status: string;
  createdAt: string;
  approverComment?: string;
  reason?: string;
}

const LEAVE_TYPES = ["Vacation", "Sick", "Emergency", "Maternity", "Paternity", "Bereavement"];

const STATUS_BADGE: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
    </div>
  );
}

function LeaveModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [leaveType, setLeaveType] = useState("Vacation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState("1");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSubmit() {
    if (!startDate || !endDate) { showToast("error", "Please select start and end dates"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/employee/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType: "Leave Request", leaveType, startDate, endDate, days: parseInt(days) || 1, reason }),
      });
      if (!res.ok) { showToast("error", (await res.json()).error || "Failed to submit"); return; }
      showToast("success", "Leave request submitted!");
      setTimeout(() => { onSuccess(); onClose(); }, 1000);
    } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Request Leave</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Leave Type</label>
            <select className={inputCls} value={leaveType} onChange={e => setLeaveType(e.target.value)}>
              {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Start Date</label>
              <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">End Date</label>
              <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Number of Days</label>
            <input type="number" min="1" className={inputCls} value={days} onChange={e => setDays(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Reason</label>
            <textarea className={inputCls + " min-h-[80px] resize-none"} value={reason} onChange={e => setReason(e.target.value)} placeholder="Provide reason for leave..." />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-60 flex items-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}

export function LeaveClient() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/employee/leave-balance").then(r => r.json()),
      fetch("/api/employee/requests").then(r => r.json()),
    ]).then(([bal, reqs]) => {
      if (Array.isArray(bal)) setBalances(bal);
      if (Array.isArray(reqs)) {
        const leaveOnly = reqs.filter((r: LeaveRequest) =>
          r.requestType === "Leave Request" || r.leaveType
        );
        setRequests(leaveOnly);
      }
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const BALANCE_COLORS: Record<string, string> = {
    Vacation: "bg-blue-600",
    Sick: "bg-green-600",
    Emergency: "bg-red-500",
    Maternity: "bg-pink-500",
    Paternity: "bg-indigo-500",
    Bereavement: "bg-gray-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Plane className="w-6 h-6 text-blue-600" /> My Leave
        </h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
          <Plus className="w-4 h-4" /> Request Leave
        </button>
      </div>

      {/* Leave balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {balances.map(b => (
          <div key={b.leaveType} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">{b.leaveType} Leave</span>
              <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${BALANCE_COLORS[b.leaveType] || "bg-gray-500"}`}>
                {b.remainingDays} left
              </span>
            </div>
            <div className="flex items-end gap-1 mb-3">
              <span className="text-3xl font-bold text-gray-900">{b.remainingDays}</span>
              <span className="text-gray-400 text-sm pb-1">/ {b.totalDays} days</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${BALANCE_COLORS[b.leaveType] || "bg-gray-500"}`}
                style={{ width: `${b.totalDays > 0 ? (b.remainingDays / b.totalDays) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">{b.usedDays} days used</p>
          </div>
        ))}
      </div>

      {/* Leave history */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Leave History</h2>
        </div>
        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Plane className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No leave requests yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Start</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">End</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Days</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Comment</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{r.leaveType || "Leave"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.startDate ? new Date(r.startDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.endDate ? new Date(r.endDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.days ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status] || "bg-gray-100 text-gray-600"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{r.approverComment || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <LeaveModal onClose={() => setShowModal(false)} onSuccess={load} />}
    </div>
  );
}
