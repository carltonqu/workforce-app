"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plane, Save, Loader2, X, ChevronLeft, CheckCircle2, AlertCircle,
  Calendar, User, Building, FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ToastState = { type: "success" | "error"; message: string } | null;

const LEAVE_TYPES = [
  { value: "Vacation", label: "Vacation", color: "bg-blue-100 text-blue-700" },
  { value: "Sick Leave", label: "Sick Leave", color: "bg-red-100 text-red-700" },
  { value: "Emergency", label: "Emergency", color: "bg-orange-100 text-orange-700" },
  { value: "Maternity", label: "Maternity", color: "bg-pink-100 text-pink-700" },
  { value: "Paternity", label: "Paternity", color: "bg-indigo-100 text-indigo-700" },
  { value: "Bereavement", label: "Bereavement", color: "bg-gray-100 text-gray-700" },
  { value: "Unpaid", label: "Unpaid", color: "bg-yellow-100 text-yellow-700" },
  { value: "Other", label: "Other", color: "bg-purple-100 text-purple-700" },
];

const INPUT_CLASS =
  "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

export function NewLeaveClient() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const [form, setForm] = useState({
    employeeName: "",
    employeeId: "",
    department: "",
    leaveType: "Vacation",
    startDate: "",
    endDate: "",
    days: "1",
    reason: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-calculate days when dates change
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 0) {
      setForm((prev) => ({ ...prev, days: diffDays.toString() }));
    }
  };

  const handleStartDateChange = (value: string) => {
    setForm((prev) => ({ ...prev, startDate: value }));
    calculateDays(value, form.endDate);
  };

  const handleEndDateChange = (value: string) => {
    setForm((prev) => ({ ...prev, endDate: value }));
    calculateDays(form.startDate, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.employeeName.trim()) {
      setToast({ type: "error", message: "Employee name is required" });
      return;
    }
    if (!form.startDate || !form.endDate) {
      setToast({ type: "error", message: "Start and end dates are required" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          days: parseInt(form.days) || 1,
        }),
      });
      
      if (res.ok) {
        setToast({ type: "success", message: "Leave request created successfully" });
        setTimeout(() => {
          router.push("/leave");
          router.refresh();
        }, 1500);
      } else {
        const error = await res.json();
        setToast({ type: "error", message: error.error || "Failed to create leave request" });
      }
    } catch {
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
        <button onClick={() => router.push("/leave")} className="hover:text-blue-600 transition-colors">
          Leave
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Add Leave Request</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/leave")}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Leave Request</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create a new leave request for an employee</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-gray-100 dark:border-gray-800 shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Leave Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Employee Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.employeeName}
                  onChange={(e) => handleChange("employeeName", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter employee name"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={form.employeeId}
                  onChange={(e) => handleChange("employeeId", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Optional employee ID"
                />
              </div>
            </div>

            {/* Department and Leave Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2 flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  Department
                </label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter department"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.leaveType}
                  onChange={(e) => handleChange("leaveType", e.target.value)}
                  className={INPUT_CLASS}
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">
                  Days
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.days}
                  onChange={(e) => handleChange("days", e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Reason
              </label>
              <textarea
                rows={3}
                value={form.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
                className={`${INPUT_CLASS} min-h-[100px] resize-none`}
                placeholder="Optional reason for leave..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => router.push("/leave")} 
                className="rounded-xl"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl shadow-md shadow-blue-200 dark:shadow-blue-900/30"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Create Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
