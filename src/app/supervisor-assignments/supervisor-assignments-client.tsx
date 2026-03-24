"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Loader2, Save, Send, Eye, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Employee = {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  department?: string | null;
  branchLocation?: string | null;
  position?: string | null;
  reportingManager?: string | null;
  employmentStatus: string;
};

type ToastState = { type: "success" | "error"; message: string } | null;
type AssignmentLevel = "1st Supervisor" | "2nd Team Leader";

const LEVELS: AssignmentLevel[] = ["1st Supervisor", "2nd Team Leader"];

const inputCls =
  "w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

function parseReportingManager(raw?: string | null): { level: AssignmentLevel; managerName: string } {
  const value = (raw || "").trim();
  if (!value) return { level: "1st Supervisor", managerName: "" };

  const m = value.match(/^(1st Supervisor|2nd Team Leader)\s*:\s*(.+)$/i);
  if (m) {
    const level = m[1].toLowerCase().includes("2nd") ? "2nd Team Leader" : "1st Supervisor";
    return { level, managerName: m[2].trim() };
  }

  return { level: "1st Supervisor", managerName: value };
}

function formatReportingManager(level: AssignmentLevel, managerName: string): string | null {
  const trimmed = managerName.trim();
  if (!trimmed) return null;
  return `${level}: ${trimmed}`;
}

export function SupervisorAssignmentsClient() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [draftManager, setDraftManager] = useState<Record<string, string>>({});
  const [draftLevel, setDraftLevel] = useState<Record<string, AssignmentLevel>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<ToastState>(null);

  const [bulkGroupBy, setBulkGroupBy] = useState<"department" | "branch">("department");
  const [bulkGroupValue, setBulkGroupValue] = useState("");
  const [bulkSupervisor, setBulkSupervisor] = useState("");
  const [bulkLevel, setBulkLevel] = useState<AssignmentLevel>("1st Supervisor");
  const [bulkApplying, setBulkApplying] = useState(false);

  const supervisors = useMemo(() => {
    return employees
      .filter((e) => e.employmentStatus === "Active")
      .map((e) => ({ id: e.id, name: e.fullName, role: e.position || "Employee" }));
  }, [employees]);

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department).filter(Boolean) as string[])).sort(),
    [employees]
  );

  const branches = useMemo(
    () => Array.from(new Set(employees.map((e) => e.branchLocation).filter(Boolean) as string[])).sort(),
    [employees]
  );

  const groupOptions = bulkGroupBy === "department" ? departments : branches;

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.fullName, e.employeeId, e.email, e.department || "", e.position || "", e.branchLocation || ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [employees, search]);

  const assignedCount = useMemo(
    () =>
      employees.filter((e) => {
        const parsed = parseReportingManager(e.reportingManager);
        const manager = draftManager[e.id] ?? parsed.managerName;
        return manager.trim().length > 0;
      }).length,
    [employees, draftManager]
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
    const parsed = parseReportingManager(employee.reportingManager);
    const managerName = (draftManager[employee.id] ?? parsed.managerName).trim();
    const level = draftLevel[employee.id] ?? parsed.level;

    setSavingId(employee.id);
    try {
      const reportingManager = formatReportingManager(level, managerName);
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportingManager }),
      });

      if (!res.ok) {
        const msg = (await res.json()).error || "Failed to save assignment";
        throw new Error(msg);
      }

      setEmployees((prev) =>
        prev.map((e) => (e.id === employee.id ? { ...e, reportingManager } : e))
      );

      setDraftManager((prev) => {
        const next = { ...prev };
        delete next[employee.id];
        return next;
      });
      setDraftLevel((prev) => {
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

  async function applyBulkAssignment() {
    if (!bulkGroupValue || !bulkSupervisor) {
      setToast({ type: "error", message: "Please select group and supervisor." });
      return;
    }

    const targets = employees.filter((e) => {
      const hit = bulkGroupBy === "department" ? e.department === bulkGroupValue : e.branchLocation === bulkGroupValue;
      return hit && e.fullName !== bulkSupervisor;
    });

    if (targets.length === 0) {
      setToast({ type: "error", message: "No employees matched this group." });
      return;
    }

    setBulkApplying(true);
    try {
      const reportingManager = formatReportingManager(bulkLevel, bulkSupervisor);

      for (const emp of targets) {
        const res = await fetch(`/api/employees/${emp.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportingManager }),
        });
        if (!res.ok) {
          const msg = (await res.json()).error || `Failed at ${emp.fullName}`;
          throw new Error(msg);
        }
      }

      setEmployees((prev) =>
        prev.map((e) => {
          const inTarget = targets.some((t) => t.id === e.id);
          return inTarget ? { ...e, reportingManager } : e;
        })
      );

      setToast({ type: "success", message: `Assigned ${targets.length} employees under ${bulkSupervisor}.` });
    } catch (err: any) {
      setToast({ type: "error", message: err?.message || "Bulk assignment failed." });
    } finally {
      setBulkApplying(false);
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
            Assign 1st Supervisor or 2nd Team Leader. You can also bulk assign by department or branch.
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
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">With Leader Assigned</p><p className="text-xl font-semibold text-gray-900 dark:text-white">{assignedCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Available Leaders</p><p className="text-xl font-semibold text-gray-900 dark:text-white">{supervisors.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
            <Users className="w-4 h-4" />
            Bulk Assign Group to Leader
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select value={bulkGroupBy} onChange={(e) => { setBulkGroupBy(e.target.value as any); setBulkGroupValue(""); }} className={inputCls}>
              <option value="department">By Department</option>
              <option value="branch">By Branch</option>
            </select>

            <select value={bulkGroupValue} onChange={(e) => setBulkGroupValue(e.target.value)} className={inputCls}>
              <option value="">Select {bulkGroupBy === "department" ? "Department" : "Branch"}</option>
              {groupOptions.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>

            <select value={bulkLevel} onChange={(e) => setBulkLevel(e.target.value as AssignmentLevel)} className={inputCls}>
              {LEVELS.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
            </select>

            <select value={bulkSupervisor} onChange={(e) => setBulkSupervisor(e.target.value)} className={inputCls}>
              <option value="">Select Leader</option>
              {supervisors.map((s) => <option key={s.id} value={s.name}>{s.name} ({s.role})</option>)}
            </select>

            <Button onClick={applyBulkAssignment} disabled={bulkApplying} className="bg-blue-600 hover:bg-blue-700 text-white">
              {bulkApplying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Applying</> : "Apply to Group"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            className={inputCls}
            placeholder="Search employee by name, ID, email, department, branch..."
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Department / Branch</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Current Assignment</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Choose Level</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Assign / Edit Leader</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => {
                    const parsed = parseReportingManager(employee.reportingManager);
                    const selectedManager = draftManager[employee.id] ?? parsed.managerName;
                    const selectedLevel = draftLevel[employee.id] ?? parsed.level;
                    const currentFormatted = formatReportingManager(parsed.level, parsed.managerName) || "";
                    const nextFormatted = formatReportingManager(selectedLevel, selectedManager) || "";
                    const dirty = nextFormatted !== currentFormatted;

                    return (
                      <tr key={employee.id} className="border-b border-gray-50 dark:border-gray-800/50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{employee.fullName}</p>
                          <p className="text-xs text-gray-500">{employee.employeeId} • {employee.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{employee.department || "—"} / {employee.branchLocation || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{employee.reportingManager || "Unassigned"}</td>
                        <td className="px-4 py-3 min-w-48">
                          <select
                            value={selectedLevel}
                            onChange={(e) => setDraftLevel((prev) => ({ ...prev, [employee.id]: e.target.value as AssignmentLevel }))}
                            className={inputCls}
                          >
                            {LEVELS.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 min-w-64">
                          <select
                            value={selectedManager}
                            onChange={(e) => setDraftManager((prev) => ({ ...prev, [employee.id]: e.target.value }))}
                            className={inputCls}
                          >
                            <option value="">— No leader assigned —</option>
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
