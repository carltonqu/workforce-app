"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  Calendar, Clock, Search, Plus, 
  Edit2, Trash2, X, ChevronLeft, ChevronRight,
  Save, Loader2, Users, Sun, Sparkles, Filter,
  CalendarDays, Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Employee = {
  id: string;
  fullName: string;
  employeeId: string;
  email: string;
  department?: string | null;
  branchLocation?: string | null;
  position?: string | null;
};

type Schedule = {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: "morning" | "afternoon" | "night" | "custom";
  notes?: string;
};

type GroupType = "department" | "branch";

type ToastState = { type: "success" | "error"; message: string } | null;

const SHIFT_CONFIG = {
  morning: { label: "Morning", icon: Sun, color: "from-amber-500 to-orange-500", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  afternoon: { label: "Afternoon", icon: Sun, color: "from-blue-500 to-cyan-500", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  night: { label: "Night", icon: Clock, color: "from-indigo-500 to-purple-500", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  custom: { label: "Custom", icon: Calendar, color: "from-gray-500 to-gray-600", bg: "bg-gray-50 text-gray-700 border-gray-200" },
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

// Get week dates
function getWeekDates(baseDate: Date = new Date()) {
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return { start, dates };
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDay(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function SchedulingClient() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { start: weekStart, dates: weekDates } = useMemo(() => getWeekDates(currentWeek), [currentWeek]);

  const [scheduleSearch, setScheduleSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [assignMode, setAssignMode] = useState<"individual" | "group">("individual");
  
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [groupType, setGroupType] = useState<GroupType>("department");
  const [groupName, setGroupName] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [shiftType, setShiftType] = useState<"morning" | "afternoon" | "night" | "custom">("morning");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, [weekStart]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchData() {
    setLoading(true);
    try {
      const [empRes, schedRes] = await Promise.all([
        fetch("/api/employees"),
        fetch(`/api/schedules?weekStart=${weekStart.toISOString()}`)
      ]);
      
      if (!empRes.ok || !schedRes.ok) throw new Error("Failed to load");
      
      const empData = await empRes.json();
      const schedData = await schedRes.json();
      
      setEmployees(empData);
      setSchedules(schedData);
    } catch {
      setToast({ type: "error", message: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  }

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean))) as string[];
  const branches = Array.from(new Set(employees.map(e => e.branchLocation).filter(Boolean))) as string[];

  const filteredSchedules = schedules.filter(s =>
    s.employeeName.toLowerCase().includes(scheduleSearch.toLowerCase()) ||
    formatDate(new Date(s.date)).toLowerCase().includes(scheduleSearch.toLowerCase())
  );

  const schedulesByDate = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    weekDates.forEach(d => {
      const key = d.toISOString().split("T")[0];
      map.set(key, []);
    });
    schedules.forEach(s => {
      const key = new Date(s.date).toISOString().split("T")[0];
      if (map.has(key)) {
        map.get(key)!.push(s);
      }
    });
    return map;
  }, [schedules, weekDates]);

  function resetForm() {
    setSelectedEmployee("");
    setGroupName("");
    setSelectedDate("");
    setStartTime("09:00");
    setEndTime("17:00");
    setShiftType("morning");
    setNotes("");
    setEditingSchedule(null);
    setAssignMode("individual");
  }

  function startEdit(schedule: Schedule) {
    setEditingSchedule(schedule);
    setSelectedEmployee(schedule.employeeId);
    setSelectedDate(schedule.date.split("T")[0]);
    setStartTime(schedule.startTime);
    setEndTime(schedule.endTime);
    setShiftType(schedule.shiftType);
    setNotes(schedule.notes || "");
    setAssignMode("individual");
    setShowForm(true);
  }

  async function saveSchedule() {
    if (!selectedDate || !startTime || !endTime) {
      setToast({ type: "error", message: "Please fill all required fields" });
      return;
    }

    if (assignMode === "individual" && !selectedEmployee) {
      setToast({ type: "error", message: "Please select an employee" });
      return;
    }

    if (assignMode === "group" && !groupName) {
      setToast({ type: "error", message: "Please select a group" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: editingSchedule?.id,
        date: selectedDate,
        startTime,
        endTime,
        shiftType,
        notes,
        assignMode,
        employeeId: assignMode === "individual" ? selectedEmployee : null,
        groupType: assignMode === "group" ? groupType : null,
        groupName: assignMode === "group" ? groupName : null,
      };

      const res = await fetch("/api/schedules", {
        method: editingSchedule ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      const result = await res.json();
      
      if (editingSchedule) {
        setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? result.schedule : s));
        setToast({ type: "success", message: "Schedule updated successfully" });
      } else {
        if (Array.isArray(result.schedules)) {
          setSchedules(prev => [...prev, ...result.schedules]);
          setToast({ type: "success", message: `${result.schedules.length} schedules created` });
        } else {
          setSchedules(prev => [...prev, result.schedule]);
          setToast({ type: "success", message: "Schedule created" });
        }
      }

      setShowForm(false);
      resetForm();
    } catch {
      setToast({ type: "error", message: "Failed to save schedule" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteSchedule(id: string) {
    if (!confirm("Delete this schedule?")) return;
    
    try {
      const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      
      setSchedules(prev => prev.filter(s => s.id !== id));
      setToast({ type: "success", message: "Schedule deleted" });
    } catch {
      setToast({ type: "error", message: "Failed to delete" });
    }
  }

  function prevWeek() {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() - 7);
    setCurrentWeek(d);
  }

  function nextWeek() {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() + 7);
    setCurrentWeek(d);
  }

  const thisWeekCount = schedules.filter(s => {
    const d = new Date(s.date);
    return d >= weekStart && d < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  }).length;

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
        <div className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm shadow-lg animate-fade-in-up ${
          toast.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
            : "bg-rose-50 text-rose-800 border border-rose-200"
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-blue-500" />
              Scheduling
            </h1>
            <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              {schedules.length} Total
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage employee work schedules and shifts
          </p>
        </div>
        <Button 
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30 hover:shadow-lg hover:shadow-blue-300/50 transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          Create Schedule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Calendar} 
          label="Total Schedules" 
          value={schedules.length} 
          gradient="from-blue-500 to-cyan-500"
          delay={100}
        />
        <StatCard 
          icon={Clock} 
          label="This Week" 
          value={thisWeekCount} 
          gradient="from-emerald-500 to-green-500"
          delay={200}
        />
        <StatCard 
          icon={Users} 
          label="Employees" 
          value={employees.length} 
          gradient="from-amber-500 to-orange-500"
          delay={300}
        />
        <StatCard 
          icon={Sun} 
          label="Morning Shifts" 
          value={schedules.filter(s => s.shiftType === "morning").length} 
          gradient="from-purple-500 to-pink-500"
          delay={400}
        />
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-gray-100 dark:border-gray-800 shadow-sm animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  {editingSchedule ? <Edit2 className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                </div>
                <CardTitle className="text-base font-semibold">
                  {editingSchedule ? "Edit Schedule" : "Create New Schedule"}
                </CardTitle>
              </div>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Assign Mode Toggle */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
              <button
                onClick={() => setAssignMode("individual")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  assignMode === "individual" 
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setAssignMode("group")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  assignMode === "group" 
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Group
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {assignMode === "individual" ? (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Employee</label>
                  <select 
                    value={selectedEmployee} 
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select employee...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Group Type</label>
                    <select 
                      value={groupType} 
                      onChange={(e) => { setGroupType(e.target.value as GroupType); setGroupName(""); }}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="department">Department</option>
                      <option value="branch">Branch</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">
                      {groupType === "department" ? "Department" : "Branch"}
                    </label>
                    <select 
                      value={groupName} 
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select...</option>
                      {(groupType === "department" ? departments : branches).map(v => 
                        <option key={v} value={v}>{v}</option>
                      )}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Date</label>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Shift Type</label>
                <select 
                  value={shiftType} 
                  onChange={(e) => {
                    const type = e.target.value as typeof shiftType;
                    setShiftType(type);
                    if (type === "morning") { setStartTime("09:00"); setEndTime("17:00"); }
                    if (type === "afternoon") { setStartTime("14:00"); setEndTime("22:00"); }
                    if (type === "night") { setStartTime("22:00"); setEndTime("06:00"); }
                  }}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="morning">Morning (9AM - 5PM)</option>
                  <option value="afternoon">Afternoon (2PM - 10PM)</option>
                  <option value="night">Night (10PM - 6AM)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Start Time</label>
                <input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">End Time</label>
                <input 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Notes (Optional)</label>
                <input 
                  type="text" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }} className="rounded-xl">
                Cancel
              </Button>
              <Button 
                onClick={saveSchedule}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl shadow-md shadow-blue-200 dark:shadow-blue-900/30"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {editingSchedule ? "Update" : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week Navigation */}
      <Card className="border-gray-100 dark:border-gray-800 shadow-sm animate-fade-in-up" style={{ animationDelay: '600ms' }}>
        <div className="flex items-center justify-between px-6 py-4">
          <Button variant="outline" size="sm" onClick={prevWeek} className="rounded-xl">
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <div className="text-center">
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{weekStart.getFullYear()}</p>
          </div>
          <Button variant="outline" size="sm" onClick={nextWeek} className="rounded-xl">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Card>

      {/* Calendar View */}
      <div className="animate-fade-in-up" style={{ animationDelay: '700ms' }}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          Weekly Calendar
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const dateKey = date.toISOString().split("T")[0];
            const daySchedules = schedulesByDate.get(dateKey) || [];
            const isToday = new Date().toISOString().split("T")[0] === dateKey;
            
            return (
              <Card key={i} className={`border-gray-100 dark:border-gray-800 shadow-sm min-h-[200px] ${isToday ? "ring-2 ring-blue-500" : ""} hover-lift`}>
                <div className={`p-3 text-center border-b border-gray-100 dark:border-gray-800 ${isToday ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white" : "bg-gray-50 dark:bg-gray-800/50"}`}>
                  <p className={`text-xs uppercase font-medium ${isToday ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>{formatDay(date)}</p>
                  <p className={`font-semibold ${isToday ? "" : "text-gray-900 dark:text-white"}`}>{formatDate(date)}</p>
                </div>
                <CardContent className="p-2 space-y-1.5">
                  {daySchedules.map(schedule => {
                    const shiftConfig = SHIFT_CONFIG[schedule.shiftType];
                    return (
                      <div 
                        key={schedule.id}
                        onClick={() => startEdit(schedule)}
                        className="p-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl cursor-pointer transition-all border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
                      >
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{schedule.employeeName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{schedule.startTime} - {schedule.endTime}</p>
                      </div>
                    );
                  })}
                  {daySchedules.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs text-gray-400 dark:text-gray-500">No schedules</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* All Schedules List */}
      <div className="animate-fade-in-up" style={{ animationDelay: '800ms' }}>
        <Card className="border-gray-100 dark:border-gray-800 shadow-sm hover-lift">
          <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-500" />
                All Schedules
                <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-0">
                  {filteredSchedules.length}
                </Badge>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search schedules..."
                  value={scheduleSearch}
                  onChange={(e) => setScheduleSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredSchedules.map((schedule, index) => {
                const shiftConfig = SHIFT_CONFIG[schedule.shiftType];
                return (
                  <div 
                    key={schedule.id} 
                    className="flex items-center justify-between p-4 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                    style={{ animationDelay: `${900 + index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${shiftConfig.color} flex items-center justify-center text-white font-semibold shadow-md`}>
                        {schedule.employeeName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{schedule.employeeName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(new Date(schedule.date))} 
                          <span className="text-gray-300">|</span>
                          <Clock className="w-3.5 h-3.5" />
                          {schedule.startTime} - {schedule.endTime}
                          {schedule.notes && (
                            <>
                              <span className="text-gray-300">|</span>
                              <Briefcase className="w-3.5 h-3.5" />
                              {schedule.notes}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${shiftConfig.bg} border-0 capitalize`}>
                        {schedule.shiftType}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          onClick={() => startEdit(schedule)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          onClick={() => deleteSchedule(schedule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredSchedules.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No schedules found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first schedule to get started</p>
                <Button 
                  onClick={() => setShowForm(true)} 
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30"
                >
                  <Plus className="w-4 h-4 mr-2" /> Create Schedule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
