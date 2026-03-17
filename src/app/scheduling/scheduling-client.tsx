"use client";

import { useState } from "react";
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
import { Plus, GripVertical, Trash2, Save } from "lucide-react";
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

export function SchedulingClient({
  initialShifts,
  employees,
  scheduleId,
  orgId,
  weekStart,
}: SchedulingClientProps) {
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

    // If dropped on a day column
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

    const overId = over.id as string;
    if (DAYS.includes(overId)) {
      // Visual feedback handled by isDragging state
    }
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
    </div>
  );
}
