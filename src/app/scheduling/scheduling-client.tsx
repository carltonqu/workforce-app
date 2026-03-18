"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical, Trash2, Save, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  day: string;
  startTime: string;
  endTime: string;
  role: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
}

interface SchedulingClientProps {
  initialShifts: Shift[];
  employees: Employee[];
  scheduleId: string | null;
  orgId: string | null;
  weekStart: string;
}

interface ApiEmployee {
  id: string;
  userId?: string;
  fullName?: string;
  name?: string;
  employeeId?: string;
  department?: string;
}

interface EmployeeShiftRow {
  id: string;
  userId: string;
  employeeName: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  shiftName: string;
  location?: string;
}

// ─── ShiftCard (must be outside parent to avoid remount) ──────────────────────

function ShiftCard({ shift, onDelete }: { shift: Shift; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: shift.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const roleColors: Record<string, string> = {
    MANAGER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    HR: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    EMPLOYEE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
          {shift.employeeName}
        </p>
        <p className="text-xs text-gray-500">
          {shift.startTime} — {shift.endTime}
        </p>
      </div>
      <Badge variant="outline" className={`text-xs ${roleColors[shift.role] || ""}`}>
        {shift.role}
      </Badge>
      <button
        onClick={() => onDelete(shift.id)}
        className="text-gray-400 hover:text-red-500 transition-colors"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Employee Shifts Tab ───────────────────────────────────────────────────────

function EmployeeShiftsTab() {
  const [apiEmployees, setApiEmployees] = useState<ApiEmployee[]>([]);
  const [scheduledShifts, setScheduledShifts] = useState<EmployeeShiftRow[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    date: new Date().toISOString().slice(0, 10),
    shiftStart: "09:00",
    shiftEnd: "17:00",
    shiftName: "Regular",
    location: "",
  });

  const today = new Date().toISOString().slice(0, 10);
  const twoWeeksLater = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        const list: ApiEmployee[] = Array.isArray(data) ? data : (data.employees || []);
        setApiEmployees(list);
        if (list.length > 0) {
          const first = list[0];
          setForm(prev => ({ ...prev, userId: first.userId || first.id }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const loadScheduledShifts = useCallback(async () => {
    setLoadingShifts(true);
    try {
      const res = await fetch(`/api/admin/schedule-employee?from=${today}&to=${twoWeeksLater}`);
      if (res.ok) {
        const data = await res.json();
        setScheduledShifts(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingShifts(false);
    }
  }, [today, twoWeeksLater]);

  useEffect(() => {
    loadEmployees();
    loadScheduledShifts();
  }, [loadEmployees, loadScheduledShifts]);

  async function handleSaveShift() {
    if (!form.userId || !form.date || !form.shiftStart || !form.shiftEnd) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/schedule-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to save shift");
        return;
      }
      toast.success("Shift saved!");
      await loadScheduledShifts();
    } catch {
      toast.error("Failed to save shift");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteShift(id: string) {
    try {
      const res = await fetch("/api/admin/schedule-employee", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { toast.error("Failed to delete shift"); return; }
      toast.success("Shift deleted");
      setScheduledShifts(prev => prev.filter(s => s.id !== id));
    } catch {
      toast.error("Failed to delete shift");
    }
  }

  return (
    <div className="space-y-6">
      {/* Assign Shift Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Assign Employee Shift
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Employee *</label>
              <select
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800"
              >
                <option value="">— Select Employee —</option>
                {apiEmployees.map((emp) => (
                  <option key={emp.userId || emp.id} value={emp.userId || emp.id}>
                    {emp.fullName || emp.name}
                    {emp.employeeId ? ` (${emp.employeeId})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start Time *</label>
              <input
                type="time"
                value={form.shiftStart}
                onChange={(e) => setForm({ ...form, shiftStart: e.target.value })}
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End Time *</label>
              <input
                type="time"
                value={form.shiftEnd}
                onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })}
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Shift Name</label>
              <input
                type="text"
                value={form.shiftName}
                onChange={(e) => setForm({ ...form, shiftName: e.target.value })}
                placeholder="Regular"
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Office / Remote"
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={handleSaveShift}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Shift"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Shifts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Upcoming Shifts (Next 14 Days)</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadScheduledShifts}
              disabled={loadingShifts}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${loadingShifts ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingShifts ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : scheduledShifts.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No shifts scheduled for the next 14 days.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">Employee</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">Date</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">Shift</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">Start</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">End</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">Location</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledShifts.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="py-2.5 px-4 font-medium text-gray-900">{row.employeeName}</td>
                      <td className="py-2.5 px-4 text-gray-600">{row.date}</td>
                      <td className="py-2.5 px-4 text-gray-600">{row.shiftName || "Regular"}</td>
                      <td className="py-2.5 px-4 text-gray-600">{row.shiftStart}</td>
                      <td className="py-2.5 px-4 text-gray-600">{row.shiftEnd}</td>
                      <td className="py-2.5 px-4 text-gray-500">{row.location || "—"}</td>
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() => handleDeleteShift(row.id)}
                          className="text-red-400 hover:text-red-600 transition"
                          title="Delete shift"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}

// ─── Main SchedulingClient ─────────────────────────────────────────────────────

export function SchedulingClient({
  initialShifts,
  employees,
  scheduleId,
  orgId,
  weekStart,
}: SchedulingClientProps) {
  const [activeTab, setActiveTab] = useState<"roster" | "employee-shifts">("roster");
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newShift, setNewShift] = useState({
    employeeId: employees[0]?.id || "",
    day: "Monday",
    startTime: "09:00",
    endTime: "17:00",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const overId = over.id as string;
    if (DAYS.includes(overId)) {
      setShifts((prev) =>
        prev.map((s) => (s.id === active.id ? { ...s, day: overId } : s))
      );
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over) return;
    // Visual feedback handled by isDragging state
  }

  function handleDelete(id: string) {
    setShifts((prev) => prev.filter((s) => s.id !== id));
  }

  function handleAddShift() {
    const employee = employees.find((e) => e.id === newShift.employeeId);
    if (!employee) return;

    const shift: Shift = {
      id: `shift-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      day: newShift.day,
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      role: employee.role,
    };

    setShifts((prev) => [...prev, shift]);
    setShowAddForm(false);
  }

  async function handleSave() {
    if (!orgId) {
      toast.error("No organization found.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId,
          orgId,
          weekStart,
          shifts,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Schedule saved!");
    } catch {
      toast.error("Failed to save schedule.");
    } finally {
      setSaving(false);
    }
  }

  const activeShift = shifts.find((s) => s.id === activeId);

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("roster")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "roster"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          Weekly Roster
        </button>
        <button
          onClick={() => setActiveTab("employee-shifts")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "employee-shifts"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          Employee Shifts
        </button>
      </div>

      {activeTab === "employee-shifts" ? (
        <EmployeeShiftsTab />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Week of{" "}
                {new Date(weekStart).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h2>
              <p className="text-sm text-gray-500">
                Drag shifts between days to reschedule
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Shift
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Schedule"}
              </Button>
            </div>
          </div>

          {/* Add Shift Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Add New Shift</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Employee</label>
                    <select
                      value={newShift.employeeId}
                      onChange={(e) => setNewShift({ ...newShift, employeeId: e.target.value })}
                      className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800"
                    >
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Day</label>
                    <select
                      value={newShift.day}
                      onChange={(e) => setNewShift({ ...newShift, day: e.target.value })}
                      className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800"
                    >
                      {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Start</label>
                    <input
                      type="time"
                      value={newShift.startTime}
                      onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                      className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">End</label>
                    <input
                      type="time"
                      value={newShift.endTime}
                      onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                      className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleAddShift} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Add Shift
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule Grid */}
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {DAYS.map((day) => {
                const dayShifts = shifts.filter((s) => s.day === day);
                return (
                  <SortableContext
                    key={day}
                    id={day}
                    items={dayShifts.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div
                      className="min-h-32 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
                    >
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                        {day.slice(0, 3)}
                      </h3>
                      <div className="space-y-2">
                        {dayShifts.map((shift) => (
                          <ShiftCard
                            key={shift.id}
                            shift={shift}
                            onDelete={handleDelete}
                          />
                        ))}
                        {dayShifts.length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-4">
                            No shifts
                          </p>
                        )}
                      </div>
                    </div>
                  </SortableContext>
                );
              })}
            </div>

            <DragOverlay>
              {activeShift ? (
                <div className="p-2 bg-white dark:bg-gray-800 border border-blue-500 rounded-lg shadow-lg opacity-90">
                  <p className="text-xs font-medium">{activeShift.employeeName}</p>
                  <p className="text-xs text-gray-500">
                    {activeShift.startTime} — {activeShift.endTime}
                  </p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}
    </div>
  );
}
