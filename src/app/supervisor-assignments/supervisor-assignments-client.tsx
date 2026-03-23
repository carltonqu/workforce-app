"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Loader2, Save, Send, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Employee = {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  department?: string | null;
  position?: string | null;
  reportingManager?: string | null;
  employmentStatus: string;
};

type ToastState = { type: "success" | "error"; message: string } | null;

const inputCls =
  "w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

export function SupervisorAssignmentsClient() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<ToastState>(null);

  const supervisors = useMemo(() => {
    return employees
      .filter((e) => e.employmentStatus === "Active")
      .map((e) => ({ id: e.id, name: e.fullName, role: e.position || "Employee" }));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.fullName, e.employeeId, e.email, e.department || "", e.position || ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [employees, search]);

  const assignedCount = useMemo(
    () => employees.filter((e) => (draft[e.id] ?? e.reportingManager ?? "").trim()).length,
    [employees, draft]
  );

  async function fetchEmployees() {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error("Failed to load employees");
      const data = await res.json();
      setEmployees(data);
    } catch {
      setToast({ type: "error", message: "Unable to load employees." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function saveAssignment(employee: Employee) {
    const nextManager = (draft[employee.id] ?? employee.reportingManager ?? "").trim();
    setSavingId(employee.id);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportingManager: nextManager || null }),
      });

      if (!res.ok) {
        const msg = (await res.json()).error || "Failed to save assignment";
        throw new Error(msg);
      }

      setEmployees((prev) =>
        prev.map((e) =>
          e.id === employee.id
            ? { ...e, reportingManager: nextManager || null }
            : e
        )
      );
      setDraft((prev) => {
        const next = { ...prev };
        delete next[employee.id];
        return next;
      });
      setToast({ type: "success", message: `Supervisor updated for ${employee.fullName}.` });
    } catch (err: any) {
      setToast({ type: "error", message: err?.message || "Failed to save assignment." });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Supervisor Assignment Center
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor, assign, send handoff direction, and edit supervisor ownership for employees.
          </p>
        </div>
        <a href="/announcements" className="inline-flex">
          <Button variant="outline">
            <Send className="w-4 h-4 mr-2" />
            Send Team Update
          </Button>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Total Employees</p><p className="text-xl font-semibold text-gray-900 dark:text-white">{employees.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">With Supervisor</p><p className="text-xl font-semibold text-gray-900 dark:text-white">{assignedCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Available Supervisors</p><p className="text-xl font-semibold text-gray-900 dark:text-white">{supervisors.length}</p></CardContent></Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            className={inputCls}
            placeholder="Search employee by name, ID, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={fetchEmployees}>
          <Eye className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">No employees found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Employee</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Department</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Current Supervisor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Assign / Edit Supervisor</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => {
                    const selectedManager = draft[employee.id] ?? employee.reportingManager ?? "";
                    const dirty = selectedManager !== (employee.reportingManager ?? "");

                    return (
                      <tr key={employee.id} className="border-b border-gray-50 dark:border-gray-800/50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{employee.fullName}</p>
                          <p className="text-xs text-gray-500">{employee.employeeId} • {employee.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{employee.department || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{employee.reportingManager || "Unassigned"}</td>
                        <td className="px-4 py-3 min-w-64">
                          <select
                            value={selectedManager}
                            onChange={(e) => setDraft((prev) => ({ ...prev, [employee.id]: e.target.value }))}
                            className={inputCls}
                          >
                            <option value="">— No supervisor —</option>
                            {supervisors
                              .filter((s) => s.name !== employee.fullName)
                              .map((s) => (
                                <option key={s.id} value={s.name}>
                                  {s.name} ({s.role})
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            onClick={() => saveAssignment(employee)}
                            disabled={!dirty || savingId === employee.id}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {savingId === employee.id ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving</>
                            ) : (
                              <><Save className="w-4 h-4 mr-2" />Save</>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-xl border px-4 py-3 text-sm shadow-lg ${toast.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-700"}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
