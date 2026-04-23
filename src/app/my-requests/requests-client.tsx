"use client";

import { useState, useEffect } from "react";
import { 
  ClipboardList, Plus, X, CheckCircle2, AlertCircle, Loader2, 
  Clock, Calendar, FileText, Sparkles, Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  Pending: { 
    bg: "bg-amber-50 dark:bg-amber-950/40", 
    text: "text-amber-700 dark:text-amber-300", 
    border: "border-amber-200 dark:border-amber-800",
    icon: Clock
  },
  Approved: { 
    bg: "bg-emerald-50 dark:bg-emerald-950/40", 
    text: "text-emerald-700 dark:text-emerald-300", 
    border: "border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2
  },
  Rejected: { 
    bg: "bg-rose-50 dark:bg-rose-950/40", 
    text: "text-rose-700 dark:text-rose-300", 
    border: "border-rose-200 dark:border-rose-800",
    icon: AlertCircle
  },
};

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const duration = 600;
    const steps = 20;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{displayValue}</span>;
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  gradient,
  delay = 0
}: { 
  icon: any; 
  label: string; 
  value: number; 
  gradient: string;
  delay?: number;
}) {
  return (
    <div 
      className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-lg hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700`} />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            <AnimatedCounter value={value} />
          </p>
        </div>
        <div className={`bg-gradient-to-br ${gradient} p-2.5 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      {status === "Pending" && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
      )}
      {status !== "Pending" && <Icon className="w-3.5 h-3.5" />}
      {status}
    </span>
  );
}

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in-up ${type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
    </div>
  );
}

const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200";

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
      showToast("success", "Request submitted successfully!");
      setTimeout(() => { onSuccess(); onClose(); }, 1000);
    } finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Submit Request</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Request Type</label>
            <select className={inputCls} value={requestType} onChange={e => setRequestType(e.target.value)}>
              {REQUEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {requestType === "Leave Request" ? (
            <>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Leave Type</label>
                <select className={inputCls} value={leaveType} onChange={e => setLeaveType(e.target.value)}>
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Start Date</label>
                  <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">End Date</label>
                  <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Number of Days</label>
                <input type="number" min="1" className={inputCls} value={days} onChange={e => setDays(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Reason</label>
                <textarea className={inputCls + " min-h-[100px] resize-none"} value={reason} onChange={e => setReason(e.target.value)} placeholder="Provide reason for leave..." />
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Details</label>
              <textarea className={inputCls + " min-h-[120px] resize-none"} value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe your request in detail..." />
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800/50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center gap-2 shadow-md shadow-blue-200 dark:shadow-blue-900/30 hover:shadow-lg hover:shadow-blue-300/50">
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
  
  const pendingCount = requests.filter(r => r.status === "Pending").length;
  const approvedCount = requests.filter(r => r.status === "Approved").length;
  const rejectedCount = requests.filter(r => r.status === "Rejected").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-blue-500" />
              My Requests
            </h1>
            <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              {requests.length} Total
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your leave, overtime, and other requests
          </p>
        </div>
        <Button 
          onClick={() => setShowModal(true)} 
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30 hover:shadow-lg hover:shadow-blue-300/50 transition-all duration-300"
        >
          <Plus className="w-4 h-4" /> Submit Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={ClipboardList} 
          label="Total Requests" 
          value={requests.length} 
          gradient="from-blue-500 to-cyan-500"
          delay={100}
        />
        <StatCard 
          icon={Clock} 
          label="Pending" 
          value={pendingCount} 
          gradient="from-amber-500 to-orange-500"
          delay={200}
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Approved" 
          value={approvedCount} 
          gradient="from-emerald-500 to-green-500"
          delay={300}
        />
        <StatCard 
          icon={AlertCircle} 
          label="Rejected" 
          value={rejectedCount} 
          gradient="from-rose-500 to-pink-500"
          delay={400}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${filter === tab
              ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {tab}
            {tab !== "All" && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === tab ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                {tab === "Pending" ? pendingCount : tab === "Approved" ? approvedCount : rejectedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="border-gray-100 dark:border-gray-800 shadow-sm animate-fade-in-up hover-lift" style={{ animationDelay: '600ms' }}>
        <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-500" />
            Request History
            <span className="ml-auto text-xs font-normal text-gray-400">
              Showing {filtered.length} {filter !== "All" ? filter.toLowerCase() : ""} requests
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No {filter !== "All" ? filter.toLowerCase() : ""} requests</p>
              <button onClick={() => setShowModal(true)} className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
                Submit your first request
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-6 py-4">Type</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-6 py-3 hidden md:table-cell">Details</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-6 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-6 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-6 py-3 hidden lg:table-cell">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, index) => (
                    <tr 
                      key={r.id} 
                      className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                      style={{ animationDelay: `${700 + index * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {r.requestType || (r.leaveType ? `Leave (${r.leaveType})` : "Request")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell max-w-xs truncate">
                        {r.details || r.reason || (r.startDate ? `${r.startDate} – ${r.endDate}` : "—")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">{r.approverComment || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && <SubmitModal onClose={() => setShowModal(false)} onSuccess={load} />}
    </div>
  );
}
