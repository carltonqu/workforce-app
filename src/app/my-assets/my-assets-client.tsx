"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Loader2, RefreshCw, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const STATUS_COLORS: Record<string, string> = {
  Available: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Assigned: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "Under Repair": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  Lost: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  Retired: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const CONDITION_COLORS: Record<string, string> = {
  New: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Good: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Fair: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  Damaged: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const REQUEST_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  Approved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const URGENCY_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  Normal: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Low: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

const INPUT_CLASS =
  "w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

const ASSET_TYPES = ["Laptop", "Phone", "POS", "Uniform", "Tool", "Other"];

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
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
          <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Assets</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View your assigned assets and request new ones</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: "assets", label: "My Assets" },
          { id: "request", label: "Request Asset" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Assigned Assets</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No assets assigned to you yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {["Name", "Type", "Serial #", "Date Assigned", "Condition", "Status"].map((h) => (
                    <th key={h} className="text-left py-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{a.asset.name}</td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{a.asset.type}</td>
                    <td className="py-3 px-2 font-mono text-xs text-gray-600 dark:text-gray-400">{a.asset.serialNumber || "—"}</td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {format(new Date(a.dateAssigned), "MMM d, yyyy")}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CONDITION_COLORS[a.conditionOnAssign] || CONDITION_COLORS.Good}`}>
                        {a.conditionOnAssign}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.asset.status] || ""}`}>
                        {a.asset.status}
                      </span>
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
    <div className="space-y-6">
      {/* Request Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Request an Asset</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset Type</label>
              <select
                value={form.assetType}
                onChange={(e) => setForm({ ...form, assetType: e.target.value })}
                className={INPUT_CLASS}
              >
                {ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className={INPUT_CLASS}
                rows={3}
                placeholder="Explain why you need this asset..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urgency</label>
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
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Plus className="w-4 h-4 mr-2" />
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Request History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">My Requests</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchRequests}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No requests yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {["Asset Type", "Reason", "Urgency", "Date", "Status", "Admin Comment"].map((h) => (
                      <th key={h} className="text-left py-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{r.assetType}</td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400 max-w-xs truncate">{r.reason}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${URGENCY_COLORS[r.urgency] || URGENCY_COLORS.Normal}`}>
                          {r.urgency}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {format(new Date(r.requestedAt), "MMM d, yyyy")}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${REQUEST_STATUS_COLORS[r.status] || ""}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-500 dark:text-gray-400 text-xs">{r.adminComment || "—"}</td>
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
