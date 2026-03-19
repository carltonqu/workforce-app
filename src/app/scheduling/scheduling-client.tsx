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

// ─── Group Schedule Tab ────────────────────────────────────────────────────────

function GroupScheduleTab() {
  const [branches, setBranches] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [groupType, setGroupType] = useState<"branch" | "department">("branch");
  const [groupValue, setGroupValue] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"weekly" | "daterange">("weekly");

  // Weekly mode
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // Mon-Fri
  const [weeksCount, setWeeksCount] = useState(4);
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? 1 : 8 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  });

  // Date range mode
  const [rangeFrom, setRangeFrom] = useState(new Date().toISOString().slice(0, 10));
  const [rangeTo, setRangeTo] = useState(new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10));

  // Shift details
  const [shiftStart, setShiftStart] = useState("09:00");
  const [shiftEnd, setShiftEnd] = useState("17:00");
  const [shiftName, setShiftName] = useState("Regular Shift");
  const [location, setLocation] = useState("");
  const [isRestDay, setIsRestDay] = useState(false);

  // Preview
  const [previewEmployees, setPreviewEmployees] = useState<{ name: string; email: string }[]>([]);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetch("/api/admin/schedule-group")
      .then(r => r.json())
      .then(data => {
        setBranches(data.branches || []);
        setDepartments(data.departments || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!groupValue) { setPreviewEmployees([]); return; }
    const param = groupType === "branch" ? `branch=${encodeURIComponent(groupValue)}` : `department=${encodeURIComponent(groupValue)}`;
    fetch(`/api/employees?${param}`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.employees || []);
        setPreviewEmployees(list.map((e: { fullName?: string; name?: string; email: string }) => ({
          name: e.fullName || e.name || "—",
          email: e.email,
        })));
      })
      .catch(() => {});
  }, [groupType, groupValue]);

  function computeDates(): string[] {
    if (scheduleMode === "daterange") {
      const dates: string[] = [];
      const start = new Date(rangeFrom + "T00:00:00");
      const end = new Date(rangeTo + "T00:00:00");
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().slice(0, 10));
      }
      return dates;
    } else {
      // weekly recurring
      const dates: string[] = [];
      const startOfWeek = new Date(weekStartDate + "T00:00:00");
      // Normalize startOfWeek to the Monday of that week
      const startDay = startOfWeek.getDay(); // 0=Sun
      const mondayOffset = startDay === 0 ? -6 : 1 - startDay;
      const weekBase = new Date(startOfWeek);
      weekBase.setDate(startOfWeek.getDate() + mondayOffset);

      for (let week = 0; week < weeksCount; week++) {
        for (const day of selectedDays) {
          // day: 0=Sun, 1=Mon...6=Sat
          // weekBase is Monday (day 1)
          const offset = (day === 0 ? 6 : day - 1); // Mon=0 offset
          const d = new Date(weekBase);
          d.setDate(weekBase.getDate() + week * 7 + offset);
          dates.push(d.toISOString().slice(0, 10));
        }
      }
      return Array.from(new Set(dates)).sort();
    }
  }

  async function handleApply() {
    if (!groupValue) { toast.error("Select a branch or department first"); return; }
    const dates = computeDates();
    if (dates.length === 0) { toast.error("No dates selected"); return; }

    setApplying(true);
    try {
      const res = await fetch("/api/admin/schedule-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupType, groupValue, dates, shiftStart, shiftEnd, shiftName, location, isRestDay }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to apply schedule"); return; }
      toast.success(data.message || "Schedule applied!");
    } catch {
      toast.error("Failed to apply schedule");
    } finally {
      setApplying(false);
    }
  }

  const dates = computeDates();
  const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Group Schedule
          </CardTitle>
          <p className="text-sm text-gray-500">Set one schedule for an entire branch or department at once.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Group type toggle */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Apply to</label>
            <div className="flex gap-3">
              {(["branch", "department"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setGroupType(t); setGroupValue(""); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                    groupType === t
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400"
                  }`}
                >
                  {t === "branch" ? "🏢 Branch" : "👥 Department"}
                </button>
              ))}
            </div>
          </div>

          {/* Group selector */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              Select {groupType === "branch" ? "Branch" : "Department"}
            </label>
            <select
              value={groupValue}
              onChange={e => setGroupValue(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">— Select {groupType} —</option>
              {(groupType === "branch" ? branches : departments).map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            {previewEmployees.length > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                {previewEmployees.length} employee(s) will be affected:{" "}
                {previewEmployees.slice(0, 3).map(e => e.name).join(", ")}
                {previewEmployees.length > 3 ? ` +${previewEmployees.length - 3} more` : ""}
              </p>
            )}
            {groupValue && previewEmployees.length === 0 && (
              <p className="text-xs text-orange-500 mt-1">⚠️ No employees found in this {groupType}</p>
            )}
          </div>

          {/* Schedule mode */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Schedule Type</label>
            <div className="flex gap-3">
              {(["weekly", "daterange"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setScheduleMode(m)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    scheduleMode === m
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400"
                  }`}
                >
                  {m === "weekly" ? "📅 Weekly Recurring" : "📆 Date Range"}
                </button>
              ))}
            </div>
          </div>

          {/* Weekly mode settings */}
          {scheduleMode === "weekly" && (
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Days of week</label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS_SHORT.map((day, idx) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDays(prev =>
                        prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                      )}
                      className={`w-10 h-10 rounded-full text-xs font-semibold border transition-colors ${
                        selectedDays.includes(idx)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Starting from</label>
                  <input type="date" value={weekStartDate} onChange={e => setWeekStartDate(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Number of weeks</label>
                  <input type="number" min={1} max={52} value={weeksCount} onChange={e => setWeeksCount(Number(e.target.value))}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900" />
                </div>
              </div>
            </div>
          )}

          {/* Date range mode settings */}
          {scheduleMode === "daterange" && (
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">From</label>
                <input type="date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">To</label>
                <input type="date" value={rangeTo} onChange={e => setRangeTo(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900" />
              </div>
            </div>
          )}

          {/* Shift details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Shift Start</label>
              <input type="time" value={shiftStart} onChange={e => setShiftStart(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Shift End</label>
              <input type="time" value={shiftEnd} onChange={e => setShiftEnd(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Shift Name</label>
              <input type="text" value={shiftName} onChange={e => setShiftName(e.target.value)} placeholder="Regular Shift"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Location (optional)</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Branch name"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={isRestDay} onChange={e => setIsRestDay(e.target.checked)} className="w-4 h-4" />
            Mark as Rest Day (no work)
          </label>

          {/* Preview summary */}
          {dates.length > 0 && groupValue && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Preview</p>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Will apply <strong>{shiftStart} – {shiftEnd}</strong> ({shiftName}) to{" "}
                <strong>{previewEmployees.length} employee(s)</strong> across{" "}
                <strong>{dates.length} date(s)</strong>
                {dates.length <= 5 ? `: ${dates.join(", ")}` : `: ${dates.slice(0, 3).join(", ")} ... ${dates[dates.length - 1]}`}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                Total: {previewEmployees.length * dates.length} shift entries
              </p>
            </div>
          )}

          <button
            onClick={handleApply}
            disabled={applying || !groupValue || dates.length === 0}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {applying
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Applying...</>
              : <><Save className="w-4 h-4" /> Apply Group Schedule</>}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState<"group-schedule" | "roster" | "employee-shifts">("group-schedule");
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
          onClick={() => setActiveTab("group-schedule")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "group-schedule"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          Group Schedule
        </button>
        <button
          onClick={() => setActiveTab("employee-shifts")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "employee-shifts"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          Individual
        </button>
        <button
          onClick={() => setActiveTab("roster")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === "roster"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          Weekly View
        </button>
      </div>

      {activeTab === "group-schedule" ? (
        <GroupScheduleTab />
      ) : activeTab === "employee-shifts" ? (
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
