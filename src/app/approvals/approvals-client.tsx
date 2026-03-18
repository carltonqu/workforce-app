"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardCheck, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface ApprovalItem {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string | null;
  requestType: string;
  details: string | null;
  status: string;
  priority: string;
  createdAt: string;
  adminComment?: string | null;
}

const TABS = ["All", "Leave", "Overtime", "Attendance Correction", "Shift Swap"];

const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  Normal: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Low: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
};

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  Approved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export function ApprovalsClient({ user }: { user: any }) {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/approvals");
      if (res.ok) {
        setItems(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (item: ApprovalItem, status: "Approved" | "Rejected") => {
    setActionLoading(item.id + status);
    try {
      const res = await fetch(`/api/admin/approvals/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          isLeave: item.requestType === "Leave Request",
        }),
      });
      if (res.ok) {
        showToast(`Request ${status.toLowerCase()} successfully`);
        await fetchData();
      } else {
        showToast("Action failed", "error");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = items.filter((i) => i.status === "Pending").length;

  const filtered =
    activeTab === "All"
      ? items
      : activeTab === "Leave"
      ? items.filter((i) => i.requestType === "Leave Request")
      : items.filter((i) => i.requestType === activeTab);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-green-500" />
            Approvals
          </h1>
          {pendingCount > 0 && (
            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
              {pendingCount} pending
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={fetchData} className="flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-green-600 text-green-700 dark:text-green-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <ClipboardCheck className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No approval requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["Employee", "Type", "Details", "Date", "Priority", "Status", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white whitespace-nowrap">
                          {item.employeeName}
                        </div>
                        {item.department && (
                          <div className="text-xs text-gray-400">{item.department}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 whitespace-nowrap">
                          {item.requestType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                        {item.details ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                        {item.createdAt
                          ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            PRIORITY_COLORS[item.priority] ?? PRIORITY_COLORS.Normal
                          }`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.status === "Pending" ? (
                          <div className="flex gap-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleAction(item, "Approved")}
                              disabled={!!actionLoading}
                              className="px-2.5 py-1 rounded text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900 font-medium transition-colors disabled:opacity-50"
                            >
                              {actionLoading === item.id + "Approved" ? "..." : "✓ Approve"}
                            </button>
                            <button
                              onClick={() => handleAction(item, "Rejected")}
                              disabled={!!actionLoading}
                              className="px-2.5 py-1 rounded text-xs bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 font-medium transition-colors disabled:opacity-50"
                            >
                              {actionLoading === item.id + "Rejected" ? "..." : "✗ Reject"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
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
