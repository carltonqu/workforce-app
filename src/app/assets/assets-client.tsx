"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  X,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  type: string;
  serialNumber: string | null;
  brand: string | null;
  model: string | null;
  condition: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface AssignedAsset {
  id: string;
  assetId: string;
  employeeId: string;
  employeeDbId: string;
  conditionOnAssign: string;
  dateAssigned: string;
  notes: string | null;
  asset: Asset;
  employee: {
    id: string;
    employeeId: string;
    fullName: string;
    department: string | null;
    branchLocation: string | null;
  } | null;
}

interface AssetRequest {
  id: string;
  employeeId: string;
  assetType: string;
  reason: string;
  urgency: string;
  status: string;
  adminComment: string | null;
  requestedAt: string;
  employeeName: string;
  department: string | null;
}

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  department: string | null;
  branchLocation: string | null;
}

// ─── Badge Helpers ──────────────────────────────────────────────────────────────

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

const URGENCY_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  Normal: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Low: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

const REQUEST_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  Approved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const INPUT_CLASS =
  "w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

const ASSET_TYPES = ["Laptop", "Phone", "POS", "Uniform", "Tool", "Other"];
const CONDITIONS = ["New", "Good", "Fair", "Damaged"];

// ─── Main Component ─────────────────────────────────────────────────────────────

export function AssetsClient({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("inventory");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
          <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Asset Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage company assets and assignments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: "inventory", label: "Asset Inventory" },
          { id: "assigned", label: "Assigned Assets" },
          { id: "requests", label: "Asset Requests" },
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

      {activeTab === "inventory" && <InventoryTab showToast={showToast} />}
      {activeTab === "assigned" && <AssignedTab showToast={showToast} />}
      {activeTab === "requests" && <RequestsTab showToast={showToast} />}
    </div>
  );
}

// ─── Tab 1: Inventory ──────────────────────────────────────────────────────────

function InventoryTab({ showToast }: { showToast: (m: string, t?: "success" | "error") => void }) {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    type: "Laptop",
    serialNumber: "",
    brand: "",
    model: "",
    condition: "Good",
    status: "Available",
    notes: "",
  });

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/assets");
      if (res.ok) setAssets(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const openAdd = () => {
    setEditAsset(null);
    setForm({ name: "", type: "Laptop", serialNumber: "", brand: "", model: "", condition: "Good", status: "Available", notes: "" });
    setShowModal(true);
  };

  const openEdit = (asset: Asset) => {
    setEditAsset(asset);
    setForm({
      name: asset.name,
      type: asset.type,
      serialNumber: asset.serialNumber || "",
      brand: asset.brand || "",
      model: asset.model || "",
      condition: asset.condition,
      status: asset.status,
      notes: asset.notes || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast("Name is required", "error"); return; }
    setSaving(true);
    try {
      const url = editAsset ? `/api/admin/assets/${editAsset.id}` : "/api/admin/assets";
      const method = editAsset ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast(editAsset ? "Asset updated" : "Asset added");
        setShowModal(false);
        fetchAssets();
      } else {
        showToast("Save failed", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/assets/${id}`, { method: "DELETE" });
      if (res.ok) { showToast("Asset deleted"); fetchAssets(); }
      else showToast("Delete failed", "error");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filtered = assets.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.type.toLowerCase().includes(q) ||
      (a.serialNumber || "").toLowerCase().includes(q) ||
      a.assetCode.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Asset Inventory</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAssets}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => router.push("/dashboard/assets/new")}>
              <Plus className="w-4 h-4 mr-1" /> Add Asset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, serial, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${INPUT_CLASS} pl-9`}
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No assets found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {["Asset Code", "Name", "Type", "Serial #", "Brand", "Condition", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left py-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-2 font-mono text-xs text-gray-600 dark:text-gray-400">{a.assetCode}</td>
                      <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{a.name}</td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{a.type}</td>
                      <td className="py-3 px-2 font-mono text-xs text-gray-600 dark:text-gray-400">{a.serialNumber || "—"}</td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{a.brand || "—"}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CONDITION_COLORS[a.condition] || CONDITION_COLORS.Good}`}>
                          {a.condition}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] || STATUS_COLORS.Available}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(a)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(a.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative z-10 bg-white dark:bg-gray-900 rounded-xl p-6 max-w-sm w-full shadow-2xl mx-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Delete Asset?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-xl h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editAsset ? "Edit Asset" : "Add New Asset"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={INPUT_CLASS}
                  placeholder="e.g. MacBook Pro 14"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className={INPUT_CLASS}
                >
                  {ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={form.serialNumber}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                  className={INPUT_CLASS}
                  placeholder="Optional"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className={INPUT_CLASS}
                    placeholder="e.g. Apple"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className={INPUT_CLASS}
                    placeholder="e.g. A2442"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className={INPUT_CLASS}
                >
                  {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              {editAsset && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className={INPUT_CLASS}
                  >
                    {["Available", "Assigned", "Under Repair", "Lost", "Retired"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={INPUT_CLASS}
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editAsset ? "Save Changes" : "Add Asset"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Tab 2: Assigned Assets ────────────────────────────────────────────────────

function AssignedTab({ showToast }: { showToast: (m: string, t?: "success" | "error") => void }) {
  const [assignments, setAssignments] = useState<AssignedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [step, setStep] = useState(1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [empSearch, setEmpSearch] = useState("");
  const [empDept, setEmpDept] = useState("All");
  const [empBranch, setEmpBranch] = useState("All");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assignCondition, setAssignCondition] = useState("Good");
  const [assignNotes, setAssignNotes] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState<string | null>(null);
  const [unassignCondition, setUnassignCondition] = useState("Good");
  const [unassignTarget, setUnassignTarget] = useState<AssignedAsset | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/assets/assigned");
      if (res.ok) setAssignments(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = async () => {
    const res = await fetch("/api/admin/employees");
    if (res.ok) setEmployees(await res.json());
  };

  const fetchAvailableAssets = async () => {
    const res = await fetch("/api/admin/assets");
    if (res.ok) {
      const all: Asset[] = await res.json();
      setAvailableAssets(all.filter((a) => a.status === "Available"));
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAssignModal = async () => {
    setStep(1);
    setSelectedEmployee(null);
    setSelectedAsset(null);
    setAssignCondition("Good");
    setAssignNotes("");
    setEmpSearch("");
    setEmpDept("All");
    setEmpBranch("All");
    await fetchEmployees();
    await fetchAvailableAssets();
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedEmployee || !selectedAsset) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/admin/assets/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: selectedAsset.id,
          employeeDbId: selectedEmployee.id,
          conditionOnAssign: assignCondition,
          notes: assignNotes,
        }),
      });
      if (res.ok) {
        showToast("Asset assigned successfully");
        setShowAssignModal(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Assignment failed", "error");
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!unassignTarget) return;
    setUnassigning(unassignTarget.id);
    try {
      const res = await fetch("/api/admin/assets/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: unassignTarget.id, newCondition: unassignCondition }),
      });
      if (res.ok) {
        showToast("Asset unassigned");
        setUnassignTarget(null);
        fetchData();
      } else {
        showToast("Unassign failed", "error");
      }
    } finally {
      setUnassigning(null);
    }
  };

  const departments = ["All", ...Array.from(new Set(assignments.map((a) => a.employee?.department).filter(Boolean) as string[]))];
  const branches = ["All", ...Array.from(new Set(assignments.map((a) => a.employee?.branchLocation).filter(Boolean) as string[]))];

  const filtered = assignments.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (a.employee?.fullName || "").toLowerCase().includes(q) ||
      (a.employee?.employeeId || "").toLowerCase().includes(q) ||
      a.asset.name.toLowerCase().includes(q);
    const matchDept = deptFilter === "All" || a.employee?.department === deptFilter;
    const matchBranch = branchFilter === "All" || a.employee?.branchLocation === branchFilter;
    return matchSearch && matchDept && matchBranch;
  });

  const empDepts = ["All", ...Array.from(new Set(employees.map((e) => e.department).filter(Boolean) as string[]))];
  const empBranches = ["All", ...Array.from(new Set(employees.map((e) => e.branchLocation).filter(Boolean) as string[]))];

  const filteredEmployees = employees.filter((e) => {
    const q = empSearch.toLowerCase();
    const matchSearch = !q || e.fullName.toLowerCase().includes(q) || e.employeeId.toLowerCase().includes(q);
    const matchDept = empDept === "All" || e.department === empDept;
    const matchBranch = empBranch === "All" || e.branchLocation === empBranch;
    return matchSearch && matchDept && matchBranch;
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Assigned Assets</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={openAssignModal}>
              <Plus className="w-4 h-4 mr-1" /> Assign Asset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${INPUT_CLASS} pl-9`}
              />
            </div>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className={`${INPUT_CLASS} w-auto`}>
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
            <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className={`${INPUT_CLASS} w-auto`}>
              {branches.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No assigned assets found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {["Emp ID", "Name", "Dept", "Branch", "Asset", "Type", "Serial", "Date Assigned", "Condition", "Action"].map((h) => (
                      <th key={h} className="text-left py-3 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-2 font-mono text-xs text-gray-600 dark:text-gray-400">{a.employee?.employeeId || "—"}</td>
                      <td className="py-3 px-2 font-medium text-gray-900 dark:text-white whitespace-nowrap">{a.employee?.fullName || "Unknown"}</td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{a.employee?.department || "—"}</td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{a.employee?.branchLocation || "—"}</td>
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
                        <button
                          onClick={() => { setUnassignTarget(a); setUnassignCondition(a.conditionOnAssign); }}
                          className="px-2 py-1 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                        >
                          Unassign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unassign confirm modal */}
      {unassignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setUnassignTarget(null)} />
          <div className="relative z-10 bg-white dark:bg-gray-900 rounded-xl p-6 max-w-sm w-full shadow-2xl mx-4 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Unassign Asset</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Return <strong>{unassignTarget.asset.name}</strong> from <strong>{unassignTarget.employee?.fullName}</strong>?
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Return Condition</label>
              <select value={unassignCondition} onChange={(e) => setUnassignCondition(e.target.value)} className={INPUT_CLASS}>
                {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setUnassignTarget(null)}>Cancel</Button>
              <Button size="sm" variant="destructive" onClick={handleUnassign} disabled={!!unassigning}>
                {unassigning && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Confirm Return
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowAssignModal(false)} />
          <div className="relative z-10 w-full max-w-xl h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                {step === 2 && (
                  <button onClick={() => setStep(1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {step === 1 ? "Step 1: Select Employee" : step === 2 ? "Step 2: Select Asset" : "Confirm Assignment"}
                </h2>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {step === 1 && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    className={INPUT_CLASS}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={empDept} onChange={(e) => setEmpDept(e.target.value)} className={INPUT_CLASS}>
                      {empDepts.map((d) => <option key={d}>{d}</option>)}
                    </select>
                    <select value={empBranch} onChange={(e) => setEmpBranch(e.target.value)} className={INPUT_CLASS}>
                      {empBranches.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {filteredEmployees.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => { setSelectedEmployee(e); setStep(2); }}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 transition-colors"
                      >
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{e.fullName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{e.employeeId} · {e.department || "—"} · {e.branchLocation || "—"}</div>
                      </button>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">No employees found</div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Selected: </span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedEmployee?.fullName}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Assets ({availableAssets.length})</p>
                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    {availableAssets.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => { setSelectedAsset(a); setAssignCondition(a.condition); setStep(3); }}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 transition-colors"
                      >
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{a.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {a.assetCode} · {a.type} · {a.serialNumber || "No serial"} · Condition: {a.condition}
                        </div>
                      </button>
                    ))}
                    {availableAssets.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">No available assets</div>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Employee</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedEmployee?.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Asset</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedAsset?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Asset Code</span>
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{selectedAsset?.assetCode}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition at Assignment</label>
                    <select
                      value={assignCondition}
                      onChange={(e) => setAssignCondition(e.target.value)}
                      className={INPUT_CLASS}
                    >
                      {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
                    <textarea
                      value={assignNotes}
                      onChange={(e) => setAssignNotes(e.target.value)}
                      className={INPUT_CLASS}
                      rows={3}
                      placeholder="Any notes about this assignment..."
                    />
                  </div>
                </div>
              )}
            </div>

            {step === 3 && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={handleAssign} disabled={assigning}>
                  {assigning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm Assignment
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Tab 3: Asset Requests ─────────────────────────────────────────────────────

function RequestsTab({ showToast }: { showToast: (m: string, t?: "success" | "error") => void }) {
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/assets/requests");
      if (res.ok) setRequests(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (id: string, status: "Approved" | "Rejected") => {
    setActionLoading(id + status);
    try {
      const res = await fetch(`/api/admin/assets/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminComment: commentMap[id] || null }),
      });
      if (res.ok) {
        showToast(`Request ${status.toLowerCase()}`);
        fetchRequests();
      } else {
        showToast("Action failed", "error");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filtered =
    statusFilter === "All" ? requests : requests.filter((r) => r.status === statusFilter);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Asset Requests</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchRequests}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {/* Status filter tabs */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-4">
          {["All", "Pending", "Approved", "Rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === s
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700"
              }`}
            >
              {s}
              {s === "Pending" && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                  {requests.filter((r) => r.status === "Pending").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No requests found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{r.employeeName}</span>
                      {r.department && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">· {r.department}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Requesting: <strong>{r.assetType}</strong></span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${URGENCY_COLORS[r.urgency] || URGENCY_COLORS.Normal}`}>
                        {r.urgency}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${REQUEST_STATUS_COLORS[r.status] || ""}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">"{r.reason}"</p>
                    <p className="text-xs text-gray-400">{format(new Date(r.requestedAt), "MMM d, yyyy h:mm a")}</p>
                    {r.adminComment && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">Admin: {r.adminComment}</p>
                    )}
                  </div>
                  {r.status === "Pending" && (
                    <div className="flex flex-col gap-2 items-end shrink-0">
                      <input
                        type="text"
                        placeholder="Comment (optional)"
                        value={commentMap[r.id] || ""}
                        onChange={(e) => setCommentMap((p) => ({ ...p, [r.id]: e.target.value }))}
                        className={`${INPUT_CLASS} w-48 text-xs`}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAction(r.id, "Approved")}
                          disabled={actionLoading === r.id + "Approved"}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === r.id + "Approved" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(r.id, "Rejected")}
                          disabled={actionLoading === r.id + "Rejected"}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === r.id + "Rejected" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
