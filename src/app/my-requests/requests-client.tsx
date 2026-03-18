"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Plus, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface Request {
  id: string;
  requestType?: string;
  leaveType?: string;
  details?: string;
  reason?: string;
  status: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  approverComment?: string;
  reviewedBy?: string;
}

const REQUEST_TYPES = [
  "Leave Request",
  "Overtime Request",
  "Attendance Correction",
  "Shift Swap",
  "Schedule Change",
  "Official Business",
];

const LEAVE_TYPES = ["Vacation", "Sick", "Emergency", "Maternity", "Paternity", "Bereavement"];

const STATUS_BADGE: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

function SubmitModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [requestType, setRequestType] = useState("Leave Request");
  const [leaveType, setLeaveType] = useState("Vacation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState("1");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const body: any = { requestType };
      if (requestType === "Leave Request") {
        body.leaveType = leaveType;
        body.startDate = startDate;
        body.endDate = endDate;
        body.days = parseInt(days) || 1;
        body.reason = reason;
      } else {
        body.details = details;
      }
      const res = await fetch("/api/employee/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { showToast("error", (await res.json()).error || "Failed to submit"); return; }
      showToast("success", "Request submitted!");
      setTimeout(() => { onSuccess(); onClose(); }, 1000);
    } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Submit Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Request Type</label>
            <select className={inputCls} value={requestType} onChange={e => setRequestType(e.target.value)}>
              {REQUEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {requestType === "Leave Request" ? (
            <>
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
            </>
          ) : (
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Details</label>
              <textarea className={inputCls + " min-h-[100px] resize-none"} value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe your request..." />
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-60 flex items-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}

export function RequestsClient() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/employee/requests")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRequests(data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const tabs = ["All", "Pending", "Approved", "Rejected"];

  const filtered = filter === "All" ? requests : requests.filter(r => r.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-600" /> My Requests
        </h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition">
          <Plus className="w-4 h-4" /> Submit Request
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${filter === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {tab}
            {tab !== "All" && (
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {requests.filter(r => r.status === tab).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No {filter !== "All" ? filter.toLowerCase() : ""} requests</p>
            <button onClick={() => setShowModal(true)} className="mt-4 text-sm text-blue-600 hover:underline">Submit your first request</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Details</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden lg:table-cell">Comment</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {r.requestType || (r.leaveType ? `Leave (${r.leaveType})` : "Request")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell max-w-xs truncate">
                      {r.details || r.reason || (r.startDate ? `${r.startDate} – ${r.endDate}` : "—")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status] || "bg-gray-100 text-gray-600"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">{r.approverComment || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <SubmitModal onClose={() => setShowModal(false)} onSuccess={load} />}
    </div>
  );
}
