"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Package, Loader2, RefreshCw, Plus, Sparkles, 
  CheckCircle2, AlertCircle, FileText, Clock, 
  Briefcase, Wrench, Shield, X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  type: string;
  serialNumber: string | null;
  condition: string;
  status: string;
}

interface AssignedAsset {
  id: string;
  assetId: string;
  conditionOnAssign: string;
  dateAssigned: string;
  notes: string | null;
  asset: Asset;
}

interface AssetRequest {
  id: string;
  assetType: string;
  reason: string;
  urgency: string;
  status: string;
  adminComment: string | null;
  requestedAt: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  Available: { 
    bg: "bg-emerald-50 dark:bg-emerald-950/40", 
    text: "text-emerald-700 dark:text-emerald-300", 
    border: "border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2
  },
  Assigned: { 
    bg: "bg-blue-50 dark:bg-blue-950/40", 
    text: "text-blue-700 dark:text-blue-300", 
    border: "border-blue-200 dark:border-blue-800",
    icon: Briefcase
  },
  "Under Repair": { 
    bg: "bg-amber-50 dark:bg-amber-950/40", 
    text: "text-amber-700 dark:text-amber-300", 
    border: "border-amber-200 dark:border-amber-800",
    icon: Wrench
  },
  Lost: { 
    bg: "bg-rose-50 dark:bg-rose-950/40", 
    text: "text-rose-700 dark:text-rose-300", 
    border: "border-rose-200 dark:border-rose-800",
    icon: AlertCircle
  },
  Retired: { 
    bg: "bg-gray-50 dark:bg-gray-900", 
    text: "text-gray-600 dark:text-gray-400", 
    border: "border-gray-200 dark:border-gray-700",
    icon: Shield
  },
};

const CONDITION_CONFIG: Record<string, { bg: string; text: string }> = {
  New: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300" },
  Good: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300" },
  Fair: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300" },
  Damaged: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300" },
};

const REQUEST_STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  Pending: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  Approved: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  Rejected: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
};

const URGENCY_CONFIG: Record<string, { bg: string; text: string }> = {
  High: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300" },
  Normal: { bg: "bg-gray-50 dark:bg-gray-900", text: "text-gray-600 dark:text-gray-400" },
  Low: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300" },
};

const ASSET_TYPES = ["Laptop", "Phone", "POS", "Uniform", "Tool", "Other"];

const INPUT_CLASS =
  "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Retired;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
}

function ConditionBadge({ condition }: { condition: string }) {
  const config = CONDITION_CONFIG[condition] || CONDITION_CONFIG.Good;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {condition}
    </span>
  );
}

function RequestStatusBadge({ status }: { status: string }) {
  const config = REQUEST_STATUS_CONFIG[status] || REQUEST_STATUS_CONFIG.Pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      {status === "Pending" && (
        <span className="relative flex h-2 w-2 mr-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
      )}
      {status}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const config = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.Normal;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {urgency}
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function MyAssetsClient({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("assets");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in-up ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Assets</h1>
              <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-0">
                <Sparkles className="w-3 h-3 mr-1" /> Active
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">View your assigned assets and request new ones</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        {[
          { id: "assets", label: "My Assets", icon: Package },
          { id: "request", label: "Request Asset", icon: Plus },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "assets" && <MyAssetsTab />}
      {activeTab === "request" && <RequestTab showToast={showToast} />}
    </div>
  );
}

// ─── My Assets Tab ──────────────────────────────────────────────────────────────

function MyAssetsTab() {
  const [assignments, setAssignments] = useState<AssignedAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employee/assets");
      if (res.ok) setAssignments(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" style={{ animationDelay: '100ms' }} />
        <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" style={{ animationDelay: '200ms' }} />
      </div>
    );
  }

  return (
    <Card className="border-gray-100 dark:border-gray-800 shadow-sm animate-fade-in-up">
      <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-500" />
            Assigned Assets
            <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-0">
              {assignments.length}
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchData} className="rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No assets assigned to you yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Assets assigned to you will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                  {["Asset", "Type", "Serial #", "Date Assigned", "Condition", "Status"].map((h) => (
                    <th key={h} className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {assignments.map((a, index) => (
                  <tr 
                    key={a.id} 
                    className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                    style={{ animationDelay: `${200 + index * 50}ms` }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{a.asset.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400">{a.asset.type}</td>
                    <td className="py-4 px-6 font-mono text-xs text-gray-500 dark:text-gray-400">{a.asset.serialNumber || "—"}</td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {format(new Date(a.dateAssigned), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <ConditionBadge condition={a.conditionOnAssign} />
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={a.asset.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Request Tab ────────────────────────────────────────────────────────────────

function RequestTab({ showToast }: { showToast: (m: string, t?: "success" | "error") => void }) {
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    assetType: "Laptop",
    reason: "",
    urgency: "Normal",
  });

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/employee/assets/requests");
      if (res.ok) setRequests(await res.json());
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason.trim()) { showToast("Reason is required", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/employee/assets/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast("Request submitted successfully");
        setForm({ assetType: "Laptop", reason: "", urgency: "Normal" });
        fetchRequests();
      } else {
        showToast("Submission failed", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Request Form */}
      <Card className="border-gray-100 dark:border-gray-800 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Request an Asset</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Asset Type</label>
              <select
                value={form.assetType}
                onChange={(e) => setForm({ ...form, assetType: e.target.value })}
                className={INPUT_CLASS}
              >
                {ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">
                Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className={INPUT_CLASS + " min-h-[100px] resize-none"}
                rows={3}
                placeholder="Explain why you need this asset..."
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Urgency</label>
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                className={INPUT_CLASS}
              >
                <option>Low</option>
                <option>Normal</option>
                <option>High</option>
              </select>
            </div>
            <Button 
              type="submit" 
              disabled={submitting}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Plus className="w-4 h-4 mr-2" />
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Request History */}
      <Card className="border-gray-100 dark:border-gray-800 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              My Requests
              <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-0">
                {requests.length}
              </Badge>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchRequests} className="rounded-xl">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingRequests ? (
            <div className="space-y-3 p-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No requests yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your asset requests will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                    {["Asset Type", "Reason", "Urgency", "Date", "Status", "Comment"].map((h) => (
                      <th key={h} className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {requests.map((r, index) => (
                    <tr 
                      key={r.id} 
                      className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                            <Package className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{r.assetType}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600 dark:text-gray-400 max-w-xs truncate">{r.reason}</td>
                      <td className="py-4 px-6">
                        <UrgencyBadge urgency={r.urgency} />
                      </td>
                      <td className="py-4 px-6 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {format(new Date(r.requestedAt), "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <RequestStatusBadge status={r.status} />
                      </td>
                      <td className="py-4 px-6 text-gray-500 dark:text-gray-400 text-xs">{r.adminComment || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
