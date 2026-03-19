"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Megaphone } from "lucide-react";
import { toast } from "sonner";

interface Reaction { emoji: string; count: number; userReacted: boolean; }
interface Announcement {
  id: string; title: string; body: string; type: string;
  createdByName: string; createdAt: string;
  reactions: Reaction[];
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
  general: { label: "📢 General", color: "bg-gray-100 text-gray-700" },
  birthday: { label: "🎂 Birthday", color: "bg-pink-100 text-pink-700" },
  event: { label: "🎉 Event", color: "bg-blue-100 text-blue-700" },
  memo: { label: "📝 Memo", color: "bg-yellow-100 text-yellow-700" },
};

export function AnnouncementsClient({ userRole }: { userRole: string }) {
  const isAdmin = userRole === "MANAGER" || userRole === "HR";
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", type: "general" });

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) { const data = await res.json(); setAnnouncements(Array.isArray(data) ? data : []); }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  async function handlePost() {
    if (!form.title.trim() || !form.body.trim()) { toast.error("Fill in title and body"); return; }
    setPosting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { toast.error("Failed to post"); return; }
      toast.success("Announcement posted!");
      setForm({ title: "", body: "", type: "general" });
      setShowForm(false);
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
    try {
      await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success("Deleted");
    } catch { toast.error("Failed to delete"); }
  }

  const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" /> Announcements
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Company memos, events, and celebrations</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> Post
          </Button>
        )}
      </div>

      {/* Post form (admin) */}
      {isAdmin && showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex gap-2">
              <input className={inputCls + " flex-1"} placeholder="Announcement title..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <select className={inputCls + " w-36"} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="general">📢 General</option>
                <option value="birthday">🎂 Birthday</option>
                <option value="event">🎉 Event</option>
                <option value="memo">📝 Memo</option>
              </select>
            </div>
            <textarea
              className={inputCls}
              placeholder="Write your announcement here..."
              rows={4}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handlePost} disabled={posting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {posting ? "Posting..." : "Post Announcement"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No announcements yet</p>
            {isAdmin && <p className="text-sm text-gray-400 mt-1">Post one to get started!</p>}
          </CardContent>
        </Card>
      ) : (
        announcements.map(a => {
          const badge = TYPE_BADGES[a.type] || TYPE_BADGES.general;
          return (
            <Card key={a.id} className="overflow-hidden">
              <CardContent className="pt-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{a.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Posted by <span className="font-medium text-gray-600 dark:text-gray-300">{a.createdByName || "Admin"}</span> · {new Date(a.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDelete(a.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Body */}
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{a.body}</p>

                {/* Reaction summary */}
                {a.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-800">
                    {a.reactions.filter(r => r.count > 0).map(r => {
                      const emojiData = EMOJI_MAP.find(e => e.key === r.emoji);
                      if (!emojiData) return null;
                      return (
                        <span key={r.emoji} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${r.userReacted ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800" : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700"}`}>
                          {emojiData.emoji} {r.count}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Reaction buttons */}
                <div className="flex gap-1.5 flex-wrap pt-1 border-t border-gray-100 dark:border-gray-800">
                  {EMOJI_MAP.map(({ key, emoji }) => {
                    const reacted = a.reactions.find(r => r.emoji === key)?.userReacted;
                    return (
                      <button
                        key={key}
                        onClick={() => handleReact(a.id, key)}
                        className={`text-lg px-2 py-1 rounded-lg transition-all hover:scale-110 active:scale-95 ${reacted ? "bg-blue-100 dark:bg-blue-950 ring-1 ring-blue-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                        title={key}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
