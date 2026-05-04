"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Megaphone, Save, Loader2, X, ChevronLeft, CheckCircle2, AlertCircle,
  Tag, Building2, Users2, Calendar, Image as ImageIcon, FileText, 
  Sparkles, Send, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ToastState = { type: "success" | "error"; message: string } | null;

const TYPE_OPTIONS = [
  { value: "general", label: "📢 General", color: "from-blue-500 to-cyan-500", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "birthday", label: "🎂 Birthday", color: "from-pink-500 to-rose-500", bg: "bg-pink-50 text-pink-700 border-pink-200" },
  { value: "event", label: "🎉 Event", color: "from-purple-500 to-indigo-500", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "memo", label: "📝 Memo", color: "from-amber-500 to-orange-500", bg: "bg-amber-50 text-amber-700 border-amber-200" },
];

const STATUS_OPTIONS = [
  { value: "published", label: "Publish Now", color: "from-emerald-500 to-green-500", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "scheduled", label: "Schedule", color: "from-blue-500 to-cyan-500", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "draft", label: "Save as Draft", color: "from-gray-500 to-gray-600", bg: "bg-gray-50 text-gray-700 border-gray-200" },
];

const INPUT_CLASS =
  "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

const LABEL_CLASS = "text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2";

interface NewAnnouncementClientProps {
  userRole: string;
  branches: string[];
  departments: string[];
}

export function NewAnnouncementClient({ userRole, branches, departments }: NewAnnouncementClientProps) {
  const router = useRouter();
  const isAdmin = userRole === "MANAGER" || userRole === "HR";
  
  const [posting, setPosting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [imagePreview, setImagePreview] = useState("");
  
  const [form, setForm] = useState({
    title: "",
    body: "",
    type: "general",
    imageBase64: "",
    status: "published" as "draft" | "scheduled" | "published",
    scheduledAt: "",
    targetBranch: "",
    targetDepartment: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setToast({ type: "error", message: "Image must be under 3MB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setImagePreview(b64);
      setForm((prev) => ({ ...prev, imageBase64: b64 }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview("");
    setForm((prev) => ({ ...prev, imageBase64: "" }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setToast({ type: "error", message: "Please fill in title and message" });
      return;
    }
    if (form.status === "scheduled" && !form.scheduledAt) {
      setToast({ type: "error", message: "Please set a schedule date and time" });
      return;
    }

    setPosting(true);
    try {
      const payload = {
        ...form,
        scheduledAt: form.status === "scheduled" && form.scheduledAt 
          ? new Date(form.scheduledAt).toISOString() 
          : null,
        targetBranch: form.targetBranch || null,
        targetDepartment: form.targetDepartment || null,
        imageBase64: form.imageBase64 || null,
      };

      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        setToast({ type: "error", message: error.error || "Failed to save" });
        return;
      }

      const message = form.status === "published" 
        ? "Announcement posted!" 
        : form.status === "scheduled" 
          ? "Announcement scheduled!" 
          : "Saved as draft!";
      
      setToast({ type: "success", message });
      
      setTimeout(() => {
        router.push("/announcements");
        router.refresh();
      }, 1500);
    } catch {
      setToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setPosting(false);
    }
  };

  const selectedType = TYPE_OPTIONS.find(t => t.value === form.type);

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
        <button onClick={() => router.push("/announcements")} className="hover:text-blue-600 transition-colors">
          Announcements
        </button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">New Announcement</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/announcements")}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Announcement</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create and publish an announcement</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-gray-100 dark:border-gray-800 shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Announcement Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Title and Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className={LABEL_CLASS}>
                <Tag className="w-3 h-3 inline mr-1" />
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={INPUT_CLASS}
                placeholder="Announcement title..."
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Type</label>
              <select
                className={INPUT_CLASS}
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Body */}
          <div>
            <label className={LABEL_CLASS}>
              <FileText className="w-3 h-3 inline mr-1" />
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              className={`${INPUT_CLASS} min-h-[150px] resize-none`}
              placeholder="Write your announcement..."
              rows={5}
              value={form.body}
              onChange={(e) => handleChange("body", e.target.value)}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className={LABEL_CLASS}>
              <ImageIcon className="w-3 h-3 inline mr-1" />
              Attach Image (optional, max 3MB)
            </label>
            <div className="flex gap-3 items-start">
              <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-all text-sm text-gray-500 hover:text-blue-600">
                <ImageIcon className="w-4 h-4" /> Choose image
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-rose-600 transition-colors shadow-md"
                  >×</button>
                </div>
              )}
            </div>
          </div>

          {/* Targeting */}
          {isAdmin && (branches.length > 0 || departments.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div>
                <label className={LABEL_CLASS}>
                  <Building2 className="w-3 h-3 inline mr-1" />
                  Target Branch (optional)
                </label>
                <select
                  className={INPUT_CLASS}
                  value={form.targetBranch}
                  onChange={(e) => handleChange("targetBranch", e.target.value)}
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>
                  <Users2 className="w-3 h-3 inline mr-1" />
                  Target Department (optional)
                </label>
                <select
                  className={INPUT_CLASS}
                  value={form.targetDepartment}
                  onChange={(e) => handleChange("targetDepartment", e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Publishing Options */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4">
            <label className={LABEL_CLASS}>
              <Calendar className="w-3 h-3 inline mr-1" />
              Publishing Options
            </label>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange("status", opt.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 flex items-center gap-2 ${
                    form.status === opt.value 
                      ? opt.bg + " ring-2 ring-offset-1 ring-current" 
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {opt.value === "published" && <Send className="w-4 h-4" />}
                  {opt.value === "scheduled" && <Clock className="w-4 h-4" />}
                  {opt.value === "draft" && <FileText className="w-4 h-4" />}
                  {opt.label}
                </button>
              ))}
            </div>
            {form.status === "scheduled" && (
              <div>
                <label className={LABEL_CLASS}>Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  className={INPUT_CLASS}
                  value={form.scheduledAt}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => handleChange("scheduledAt", e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => router.push("/announcements")} 
              className="rounded-xl"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleSubmit}
              disabled={posting}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl shadow-md shadow-blue-200 dark:shadow-blue-900/30"
            >
              {posting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : form.status === "published" ? (
                <Send className="w-4 h-4 mr-2" />
              ) : form.status === "scheduled" ? (
                <Clock className="w-4 h-4 mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {form.status === "published" ? "Post Now" : form.status === "scheduled" ? "Schedule" : "Save Draft"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
