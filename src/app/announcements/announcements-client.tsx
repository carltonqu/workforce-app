"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Megaphone, Clock, Send, Edit2, X, Calendar, Building2, Users2, Tag } from "lucide-react";
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

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  general: { label: "📢 General", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  birthday: { label: "🎂 Birthday", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
  event: { label: "🎉 Event", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  memo: { label: "📝 Memo", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
};

const STATUS_BADGE: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  draft: "bg-gray-100 text-gray-600",
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

const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1";

export function AnnouncementsClient({ userRole, branches, departments }: AnnouncementsClientProps) {
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

  const PostForm = () => (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-blue-600" />
            {editingId ? "Edit Announcement" : "New Announcement"}
          </CardTitle>
          <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title + Type */}
        <div className="grid grid-cols-3 gap-3">
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
          <textarea className={inputCls} placeholder="Write your announcement..." rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
        </div>

        {/* Image upload */}
        <div>
          <label className={labelCls}>Attach Image (optional, max 3MB)</label>
          <div className="flex gap-3 items-start">
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 transition text-xs text-gray-500">
              <Calendar className="w-4 h-4" /> Choose image
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border" />
                <button
                  onClick={() => { setImagePreview(""); setForm(f => ({ ...f, imageBase64: "" })); }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                >×</button>
              </div>
            )}
          </div>
        </div>

        {/* Targeting */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
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
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-3">
          <label className={labelCls}><Calendar className="w-3 h-3 inline mr-1" />Publishing</label>
          <div className="flex gap-2 flex-wrap">
            {([
              { value: "published", label: "🟢 Publish Now", color: "border-green-400 bg-green-50 text-green-700" },
              { value: "scheduled", label: "🕐 Schedule", color: "border-blue-400 bg-blue-50 text-blue-700" },
              { value: "draft", label: "📋 Save as Draft", color: "border-gray-400 bg-gray-50 text-gray-700" },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm(f => ({ ...f, status: opt.value }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${form.status === opt.value ? opt.color + " ring-1 ring-offset-1 ring-current" : "border-gray-200 bg-white dark:bg-gray-800 text-gray-500 dark:border-gray-600"}`}
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
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={resetForm}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={posting} className="bg-blue-600 hover:bg-blue-700 text-white">
            {posting ? "Saving..." : editingId ? "Update" : form.status === "published" ? "Post Now" : form.status === "scheduled" ? "Schedule" : "Save Draft"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const AnnouncementCard = ({ a }: { a: Announcement }) => {
    const badge = TYPE_BADGES[a.type] || TYPE_BADGES.general;
    return (
      <Card className="overflow-hidden">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                {a.targetBranch && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30">🏢 {a.targetBranch}</span>}
                {a.targetDepartment && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30">👥 {a.targetDepartment}</span>}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">{a.title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Posted by <span className="font-medium text-gray-600 dark:text-gray-300">{a.createdByName || "Admin"}</span>
                {" · "}{new Date(a.publishedAt || a.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            {isAdmin && (
              <button onClick={() => handleDelete(a.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{a.body}</p>

          {a.imageBase64 && (
            <img src={a.imageBase64} alt="Announcement" className="w-full max-h-80 object-cover rounded-xl border border-gray-100 dark:border-gray-800" />
          )}

          {a.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-800">
              {a.reactions.filter(r => r.count > 0).map(r => {
                const em = EMOJI_MAP.find(e => e.key === r.emoji);
                if (!em) return null;
                return (
                  <span key={r.emoji} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${r.userReacted ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800" : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700"}`}>
                    {em.emoji} {r.count}
                  </span>
                );
              })}
            </div>
          )}

          <div className="flex gap-1.5 flex-wrap pt-1 border-t border-gray-100 dark:border-gray-800">
            {EMOJI_MAP.map(({ key, emoji }) => {
              const reacted = a.reactions.find(r => r.emoji === key)?.userReacted;
              return (
                <button key={key} onClick={() => handleReact(a.id, key)}
                  className={`text-lg px-2 py-1 rounded-lg transition-all hover:scale-110 active:scale-95 ${reacted ? "bg-blue-100 dark:bg-blue-950 ring-1 ring-blue-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
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
    const badge = TYPE_BADGES[a.type] || TYPE_BADGES.general;
    return (
      <Card className={`overflow-hidden border-l-4 ${a.status === "scheduled" ? "border-l-blue-400" : "border-l-gray-300"}`}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[a.status] || ""}`}>
                  {a.status === "scheduled" ? "🕐 Scheduled" : "📋 Draft"}
                </span>
                {a.targetBranch && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">🏢 {a.targetBranch}</span>}
                {a.targetDepartment && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">👥 {a.targetDepartment}</span>}
              </div>
              <p className="font-semibold text-gray-900 dark:text-white truncate">{a.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.body}</p>
              {a.status === "scheduled" && a.scheduledAt && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Posts on: {new Date(a.scheduledAt).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
              {a.imageBase64 && <p className="text-xs text-gray-400 mt-1">📎 Image attached</p>}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => handlePublishNow(a)} title="Publish Now"
                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition">
                <Send className="w-4 h-4" />
              </button>
              <button onClick={() => startEdit(a)} title="Edit"
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(a.id)} title="Delete"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" /> Announcements
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Company memos, events, and celebrations</p>
        </div>
        {isAdmin && !showForm && (
          <Button onClick={() => { setEditingId(null); setForm({ ...EMPTY_FORM }); setImagePreview(""); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> New Post
          </Button>
        )}
      </div>

      {/* Post form */}
      {isAdmin && showForm && <PostForm />}

      {/* Tabs (admin only) */}
      {isAdmin && !showForm && (
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
          {([
            { id: "feed" as const, label: `Feed (${publishedAnnouncements.length})` },
            { id: "queue" as const, label: `Queue (${queuedAnnouncements.length})` },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
              {tab.label}
              {tab.id === "queue" && queuedAnnouncements.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">{queuedAnnouncements.length}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Feed tab (or employee view) */}
          {(!isAdmin || activeTab === "feed") && (
            <>
              {publishedAnnouncements.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">No announcements yet</p>
                    {isAdmin && <p className="text-sm text-gray-400 mt-1">Create your first post!</p>}
                  </CardContent>
                </Card>
              ) : (
                publishedAnnouncements.map(a => <AnnouncementCard key={a.id} a={a} />)
              )}
            </>
          )}

          {/* Queue tab (admin only) */}
          {isAdmin && activeTab === "queue" && (
            <>
              {queuedAnnouncements.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">No drafts or scheduled posts</p>
                    <p className="text-sm text-gray-400 mt-1">Create a post and save as Draft or Schedule it.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {queuedAnnouncements
                    .sort((a, b) => {
                      if (a.status === "scheduled" && b.status === "draft") return -1;
                      if (a.status === "draft" && b.status === "scheduled") return 1;
                      return new Date(a.scheduledAt || a.createdAt).getTime() - new Date(b.scheduledAt || b.createdAt).getTime();
                    })
                    .map(a => <QueueCard key={a.id} a={a} />)}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
