"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar, Clock, Save, Loader2, X, ChevronLeft, Sun, Users, 
  CheckCircle2, AlertCircle, Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Employee = {
  id: string;
  fullName: string;
  department?: string | null;
  branchLocation?: string | null;
};

type GroupType = "department" | "branch";

type ToastState = { type: "success" | "error"; message: string } | null;

const SHIFT_CONFIG = {
  morning: { label: "Morning", icon: Sun, color: "from-amber-500 to-orange-500", time: { start: "09:00", end: "17:00" } },
  afternoon: { label: "Afternoon", icon: Sun, color: "from-blue-500 to-cyan-500", time: { start: "14:00", end: "22:00" } },
  night: { label: "Night", icon: Clock, color: "from-indigo-500 to-purple-500", time: { start: "22:00", end: "06:00" } },
  custom: { label: "Custom", icon: Calendar, color: "from-gray-500 to-gray-600", time: { start: "09:00", end: "17:00" } },
};

interface NewShiftClientProps {
  employees: Employee[];
  departments: string[];
  branches: string[];
}

export function NewShiftClient({ employees, departments, branches }: NewShiftClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  
  const [assignMode, setAssignMode] = useState<"individual" | "group">("individual");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [groupType, setGroupType] = useState<GroupType>("department");
  const [groupName, setGroupName] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [shiftType, setShiftType] = useState<"morning" | "afternoon" | "night" | "custom">("morning");
  const [notes, setNotes] = useState("");

  const handleShiftTypeChange = (type: typeof shiftType) => {
    setShiftType(type);
    if (type !== "custom") {
      setStartTime(SHIFT_CONFIG[type].time.start);
      setEndTime(SHIFT_CONFIG[type].time.end);
    }
  };

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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      const result = await res.json();
      const count = Array.isArray(result.schedules) ? result.schedules.length : 1;
      setToast({ type: "success", message: `${count} schedule(s) created successfully` });
      
      // Redirect after short delay
      setTimeout(() => {
        router.push("/scheduling");
        router.refresh();
      }, 1500);
    } catch {
      setToast({ type: "error", message: "Failed to save schedule" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 animate-fade-in-up">
        <button onClick={() => router.push("/scheduling")} className="hover:text-blue-600 transition-colors">
          Scheduling
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Add New Shift</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/scheduling")}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Shift</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create a new work schedule for employees</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-gray-100 dark:border-gray-800 shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Schedule Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Assign Mode Toggle */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-3">Assignment Mode</label>
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
              <button
                onClick={() => setAssignMode("individual")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  assignMode === "individual" 
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Users className="w-4 h-4" />
                Individual
              </button>
              <button
                onClick={() => setAssignMode("group")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  assignMode === "group" 
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Group
              </button>
            </div>
          </div>

          {/* Assignment Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignMode === "individual" ? (
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">
                  Employee <span className="text-red-500">*</span>
                </label>
                <select 
                  value={selectedEmployee} 
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select employee...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.fullName} {e.department ? `(${e.department})` : ""}</option>)}
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
                    {groupType === "department" ? "Department" : "Branch"} <span className="text-red-500">*</span>
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
          </div>

          {/* Date and Shift Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">
                Date <span className="text-red-500">*</span>
              </label>
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
                onChange={(e) => handleShiftTypeChange(e.target.value as typeof shiftType)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="morning">Morning (9AM - 5PM)</option>
                <option value="afternoon">Afternoon (2PM - 10PM)</option>
                <option value="night">Night (10PM - 6AM)</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          {/* Time Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">
                End Time <span className="text-red-500">*</span>
              </label>
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button 
              variant="outline" 
              onClick={() => router.push("/scheduling")} 
              className="rounded-xl"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={saveSchedule}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl shadow-md shadow-blue-200 dark:shadow-blue-900/30"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Create Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
