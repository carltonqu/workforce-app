"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Trash2, Megaphone, Clock, Send, Edit2, X, Calendar, 
  Building2, Users2, Tag, Sparkles, CheckCircle2, AlertCircle,
  FileText, Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";

interface Reaction { emoji: string; count: number; userReacted: boolean; }

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: string;
  imageBase64?: string | null;
  status: string;
  scheduledAt?: string | null;
  targetBranch?: string | null;
  targetDepartment?: string | null;
  publishedAt?: string | null;
  createdByName?: string;
  createdAt: string;
  reactions: Reaction[];
}

interface AnnouncementsClientProps {
  userRole: string;
  branches: string[];
  departments: string[];
}

const EMOJI_MAP = [
  { key: "heart", emoji: "❤️" },
  { key: "laugh", emoji: "😂" },
  { key: "clap", emoji: "👏" },
  { key: "fire", emoji: "🔥" },
  { key: "wow", emoji: "😮" },
  { key: "sad", emoji: "😢" },
];

const TYPE_CONFIG: Record<string, { label: string; icon: any; gradient: string; bg: string }> = {
  general: { 
    label: "General", 
    icon: Megaphone, 
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
  },
  birthday: { 
    label: "Birthday", 
    icon: Sparkles, 
    gradient: "from-pink-500 to-rose-500",
    bg: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800"
  },
  event: { 
    label: "Event", 
    icon: Calendar, 
    gradient: "from-purple-500 to-indigo-500",
    bg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
  },
  memo: { 
    label: "Memo", 
    icon: FileText, 
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
  },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  published: { 
    bg: "bg-emerald-50 dark:bg-emerald-950/40", 
    text: "text-emerald-700 dark:text-emerald-300", 
    border: "border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2
  },
  scheduled: { 
    bg: "bg-blue-50 dark:bg-blue-950/40", 
    text: "text-blue-700 dark:text-blue-300", 
    border: "border-blue-200 dark:border-blue-800",
    icon: Clock
  },
  draft: { 
    bg: "bg-gray-50 dark:bg-gray-900", 
    text: "text-gray-600 dark:text-gray-400", 
    border: "border-gray-200 dark:border-gray-700",
    icon: FileText
  },
};

const EMPTY_FORM = {
  title: "",
  body: "",
  type: "general",
  imageBase64: "" as string,
  status: "published" as "draft" | "scheduled" | "published",
  scheduledAt: "",
  targetBranch: "",
  targetDepartment: "",
};

const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
const labelCls = "text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2";

function TypeBadge({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.general;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="w-3.5 h-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function AnnouncementsClient({ userRole, branches, departments }: AnnouncementsClientProps) {
  const router = useRouter();
  const isAdmin = userRole === "MANAGER" || userRole === "HR";
  const [activeTab, setActiveTab] = useState<"feed" | "queue">("feed");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(Array.isArray(data) ? data : []);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("Image must be under 3MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setImagePreview(b64);
      setForm(f => ({ ...f, imageBase64: b64 }));
    };
    reader.readAsDataURL(file);
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setImagePreview("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(a: Announcement) {
    setForm({
      title: a.title,
      body: a.body,
      type: a.type,
      imageBase64: a.imageBase64 || "",
      status: (a.status as "draft" | "scheduled" | "published") || "draft",
      scheduledAt: a.scheduledAt ? a.scheduledAt.slice(0, 16) : "",
      targetBranch: a.targetBranch || "",
      targetDepartment: a.targetDepartment || "",
    });
    setImagePreview(a.imageBase64 || "");
    setEditingId(a.id);
    setShowForm(true);
    setActiveTab("queue");
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.body.trim()) { toast.error("Fill in title and body"); return; }
    if (form.status === "scheduled" && !form.scheduledAt) { toast.error("Set a schedule date/time"); return; }
    setPosting(true);
    try {
      const payload = {
        ...form,
        scheduledAt: form.status === "scheduled" && form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
        targetBranch: form.targetBranch || null,
        targetDepartment: form.targetDepartment || null,
        imageBase64: form.imageBase64 || null,
        ...(editingId ? { id: editingId } : {}),
      };
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch("/api/announcements", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { toast.error("Failed to save"); return; }
      const msg = editingId
        ? form.status === "published" ? "Published!" : "Updated!"
        : form.status === "published" ? "Posted!" : form.status === "scheduled" ? "Scheduled!" : "Saved as draft!";
      toast.success(msg);
      resetForm();
      await fetchAnnouncements();
    } catch { toast.error("Network error"); } finally { setPosting(false); }
  }

  async function handleReact(announcementId: string, emojiKey: string) {
    try {
      await fetch("/api/announcements/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId, emoji: emojiKey }),
      });
      await fetchAnnouncements();
    } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    try {
      await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success("Deleted");
    } catch { toast.error("Failed"); }
  }

  async function handlePublishNow(a: Announcement) {
    try {
      const res = await fetch("/api/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: a.id, title: a.title, body: a.body, type: a.type,
          imageBase64: a.imageBase64, status: "published",
          scheduledAt: null, targetBranch: a.targetBranch, targetDepartment: a.targetDepartment,
        }),
      });
      if (!res.ok) { toast.error("Failed"); return; }
      toast.success("Published!");
      await fetchAnnouncements();
    } catch { toast.error("Network error"); }
  }

  const publishedAnnouncements = announcements.filter(a => a.status === "published");
  const queuedAnnouncements = announcements.filter(a => a.status !== "published");

  const postFormNode = (
    <Card className="border-gray-100 dark:border-gray-800 shadow-sm animate-fade-in-up">
      <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              {editingId ? <Edit2 className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
            </div>
            <CardTitle className="text-base font-semibold">
              {editingId ? "Edit Announcement" : "New Announcement"}
            </CardTitle>
          </div>
          <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {/* Title + Type */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Title *</label>
            <input className={inputCls} placeholder="Announcement title..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}><Tag className="w-3 h-3 inline mr-1" />Type</label>
            <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="general">📢 General</option>
              <option value="birthday">🎂 Birthday</option>
              <option value="event">🎉 Event</option>
              <option value="memo">📝 Memo</option>
            </select>
          </div>
        </div>

        {/* Body */}
        <div>
          <label className={labelCls}>Message *</label>
          <textarea className={inputCls + " min-h-[120px] resize-none"} placeholder="Write your announcement..." rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
        </div>

        {/* Image upload */}
        <div>
          <label className={labelCls}>Attach Image (optional, max 3MB)</label>
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
                  onClick={() => { setImagePreview(""); setForm(f => ({ ...f, imageBase64: "" })); }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-rose-600 transition-colors shadow-md"
                >×</button>
              </div>
            )}
          </div>
        </div>

        {/* Targeting */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div>
            <label className={labelCls}><Building2 className="w-3 h-3 inline mr-1" />Target Branch (leave blank = all)</label>
            <select className={inputCls} value={form.targetBranch} onChange={e => setForm(f => ({ ...f, targetBranch: e.target.value }))}>
              <option value="">All Branches</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}><Users2 className="w-3 h-3 inline mr-1" />Target Department (leave blank = all)</label>
            <select className={inputCls} value={form.targetDepartment} onChange={e => setForm(f => ({ ...f, targetDepartment: e.target.value }))}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Status / Scheduling */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4">
          <label className={labelCls}><Calendar className="w-3 h-3 inline mr-1" />Publishing</label>
          <div className="flex gap-2 flex-wrap">
            {([
              { value: "published", label: "Publish Now", color: "from-emerald-500 to-green-500", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              { value: "scheduled", label: "Schedule", color: "from-blue-500 to-cyan-500", bg: "bg-blue-50 text-blue-700 border-blue-200" },
              { value: "draft", label: "Save as Draft", color: "from-gray-500 to-gray-600", bg: "bg-gray-50 text-gray-700 border-gray-200" },
            ] as const).map(opt => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setForm(f => ({ ...f, status: opt.value }))}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${form.status === opt.value ? opt.bg + " ring-2 ring-offset-1 ring-current" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {form.status === "scheduled" && (
            <div>
              <label className={labelCls}>Schedule Date &amp; Time</label>
              <input
                type="datetime-local"
                className={inputCls}
                value={form.scheduledAt}
                min={new Date().toISOString().slice(0, 16)}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl">Cancel</Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={posting} 
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl shadow-md shadow-blue-200 dark:shadow-blue-900/30"
          >
            {posting ? "Saving..." : editingId ? "Update" : form.status === "published" ? "Post Now" : form.status === "scheduled" ? "Schedule" : "Save Draft"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const AnnouncementCard = ({ a }: { a: Announcement }) => {
    const typeConfig = TYPE_CONFIG[a.type] || TYPE_CONFIG.general;
    return (
      <Card className="overflow-hidden border-gray-100 dark:border-gray-800 shadow-sm hover-lift animate-fade-in-up">
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <TypeBadge type={a.type} />
                {a.targetBranch && <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">🏢 {a.targetBranch}</span>}
                {a.targetDepartment && <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">👥 {a.targetDepartment}</span>}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{a.title}</h3>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                Posted by <span className="font-medium text-gray-600 dark:text-gray-300">{a.createdByName || "Admin"}</span>
                <span className="text-gray-300">·</span>
                {new Date(a.publishedAt || a.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {isAdmin && (
              <button onClick={() => handleDelete(a.id)} className="text-gray-300 hover:text-rose-500 transition-colors flex-shrink-0 p-1 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{a.body}</p>

          {a.imageBase64 && (
            <img src={a.imageBase64} alt="Announcement" className="w-full max-h-80 object-cover rounded-xl border border-gray-100 dark:border-gray-800" />
          )}

          {a.reactions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              {a.reactions.filter(r => r.count > 0).map(r => {
                const em = EMOJI_MAP.find(e => e.key === r.emoji);
                if (!em) return null;
                return (
                  <span key={r.emoji} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${r.userReacted ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300" : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"}`}>
                    {em.emoji} {r.count}
                  </span>
                );
              })}
            </div>
          )}

          <div className="flex gap-1.5 flex-wrap pt-2 border-t border-gray-100 dark:border-gray-800">
            {EMOJI_MAP.map(({ key, emoji }) => {
              const reacted = a.reactions.find(r => r.emoji === key)?.userReacted;
              return (
                <button key={key} onClick={() => handleReact(a.id, key)}
                  className={`text-lg px-3 py-1.5 rounded-xl transition-all hover:scale-110 active:scale-95 ${reacted ? "bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-400" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const QueueCard = ({ a }: { a: Announcement }) => {
    const typeConfig = TYPE_CONFIG[a.type] || TYPE_CONFIG.general;
    return (
      <Card className={`overflow-hidden border-l-4 shadow-sm hover-lift ${a.status === "scheduled" ? "border-l-blue-500" : "border-l-gray-400"}`}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-2">
                <TypeBadge type={a.type} />
                <StatusBadge status={a.status} />
                {a.targetBranch && <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">🏢 {a.targetBranch}</span>}
                {a.targetDepartment && <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">👥 {a.targetDepartment}</span>}
              </div>
              <p className="font-semibold text-gray-900 dark:text-white truncate">{a.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{a.body}</p>
              {a.status === "scheduled" && a.scheduledAt && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Posts on: {new Date(a.scheduledAt).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
              {a.imageBase64 && <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Image attached</p>}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => handlePublishNow(a)} title="Publish Now"
                className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all">
                <Send className="w-4 h-4" />
              </button>
              <button onClick={() => startEdit(a)} title="Edit"
                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(a.id)} title="Delete"
                className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-blue-500" />
              Announcements
            </h1>
            <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              {publishedAnnouncements.length}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Company memos, events, and celebrations</p>
        </div>
        {isAdmin && !showForm && (
          <Button 
            onClick={() => router.push("/dashboard/announcements/new")}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30"
          >
            <Plus className="w-4 h-4 mr-1" /> New Post
          </Button>
        )}
      </div>

      {/* Post form */}
      {isAdmin && showForm && postFormNode}

      {/* Tabs (admin only) */}
      {isAdmin && !showForm && (
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {([
            { id: "feed" as const, label: "Feed", count: publishedAnnouncements.length },
            { id: "queue" as const, label: "Queue", count: queuedAnnouncements.length },
          ]).map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
            >
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300" : "bg-gray-200 dark:bg-gray-700 text-gray-500"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      ) : (
        <>
          {/* Feed tab (or employee view) */}
          {(!isAdmin || activeTab === "feed") && (
            <div className="space-y-4">
              {publishedAnnouncements.length === 0 ? (
                <Card className="border-gray-100 dark:border-gray-800">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4">
                      <Megaphone className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No announcements yet</p>
                    {isAdmin && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create your first post!</p>}
                  </CardContent>
                </Card>
              ) : (
                publishedAnnouncements.map((a, index) => (
                  <div key={a.id} style={{ animationDelay: `${200 + index * 100}ms` }}>
                    <AnnouncementCard a={a} />
                  </div>
                ))
              )}
            </div>
          )}

          {/* Queue tab (admin only) */}
          {isAdmin && activeTab === "queue" && (
            <div className="space-y-3">
              {queuedAnnouncements.length === 0 ? (
                <Card className="border-gray-100 dark:border-gray-800">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4">
                      <Clock className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No drafts or scheduled posts</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Create a post and save as Draft or Schedule it.</p>
                  </CardContent>
                </Card>
              ) : (
                queuedAnnouncements
                  .sort((a, b) => {
                    if (a.status === "scheduled" && b.status === "draft") return -1;
                    if (a.status === "draft" && b.status === "scheduled") return 1;
                    return new Date(a.scheduledAt || a.createdAt).getTime() - new Date(b.scheduledAt || b.createdAt).getTime();
                  })
                  .map((a, index) => (
                    <div key={a.id} style={{ animationDelay: `${200 + index * 50}ms` }}>
                      <QueueCard a={a} />
                    </div>
                  ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
