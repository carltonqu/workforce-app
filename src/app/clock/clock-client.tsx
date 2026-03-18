"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";

interface TimeEntry {
  id: string;
  clockIn: string;
  clockOut: string | null;
  totalMinutes?: number;
  overtimeMinutes?: number;
  notes?: string;
}

interface Shift {
  id: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  shiftName?: string;
  location?: string;
}

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
      {type === "success" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
    </div>
  );
}

function formatDuration(startIso: string): string {
  const diff = Date.now() - new Date(startIso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function ClockClient() {
  const [now, setNow] = useState(new Date());
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [todayShift, setTodayShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [duration, setDuration] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  const loadStatus = useCallback(async () => {
    const [statusRes, shiftsRes] = await Promise.all([
      fetch("/api/time-entries/status"),
      fetch(`/api/employee/shifts?from=${today}&to=${today}`),
    ]);
    if (statusRes.ok) {
      const data = await statusRes.json();
      setActiveEntry(data.activeEntry);
      setTodayEntries(data.todayEntries || []);
    }
    if (shiftsRes.ok) {
      const shifts = await shiftsRes.json();
      if (Array.isArray(shifts) && shifts.length > 0) setTodayShift(shifts[0]);
    }
    setLoading(false);
  }, [today]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // Clock tick
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Duration ticker
  useEffect(() => {
    if (!activeEntry) { setDuration(""); return; }
    const interval = setInterval(() => setDuration(formatDuration(activeEntry.clockIn)), 1000);
    setDuration(formatDuration(activeEntry.clockIn));
    return () => clearInterval(interval);
  }, [activeEntry]);

  async function handleClockIn() {
    setProcessing(true);
    try {
      const res = await fetch("/api/time-entries/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error || "Failed to clock in"); return; }
      showToast("success", "Clocked in successfully!");
      await loadStatus();
    } finally { setProcessing(false); }
  }

  async function handleClockOut() {
    setProcessing(true);
    try {
      const res = await fetch("/api/time-entries/clock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.error || "Failed to clock out"); return; }
      showToast("success", "Clocked out successfully!");
      await loadStatus();
    } finally { setProcessing(false); }
  }

  // Compute lateness
  let statusText = "";
  let statusColor = "";
  if (todayShift && todayEntries.length > 0) {
    const shiftStartTime = new Date(`${today}T${todayShift.shiftStart}`);
    const actualClockIn = new Date(todayEntries[0].clockIn);
    const diffMinutes = Math.round((actualClockIn.getTime() - shiftStartTime.getTime()) / 60000);
    if (diffMinutes <= 0) {
      statusText = `You are ON TIME (${Math.abs(diffMinutes)} min early)`;
      statusColor = "text-green-600";
    } else {
      statusText = `You are LATE by ${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
      statusColor = "text-red-600";
    }
  }

  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Clock display */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
        <p className="text-gray-400 text-sm mb-1">{dateStr}</p>
        <p className="text-6xl font-bold text-gray-900 font-mono tracking-tight">{timeStr}</p>
      </div>

      {/* Today's shift */}
      {todayShift && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Today&apos;s Shift</span>
          </div>
          <p className="text-blue-700 font-medium">
            {todayShift.shiftStart} – {todayShift.shiftEnd}
            {todayShift.shiftName && <span className="ml-2 text-blue-500 font-normal">· {todayShift.shiftName}</span>}
          </p>
          {todayShift.location && <p className="text-blue-500 text-sm mt-0.5">📍 {todayShift.location}</p>}
        </div>
      )}

      {/* Clock in/out status + button */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
        {activeEntry ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-lg font-semibold text-green-700">CLOCKED IN</span>
            </div>
            <p className="text-gray-500 text-sm mb-1">Since {formatTime(activeEntry.clockIn)}</p>
            <p className="text-4xl font-mono font-bold text-gray-800 mb-6">{duration}</p>
            {statusText && <p className={`text-sm font-medium mb-4 ${statusColor}`}>{statusText}</p>}
            <button
              onClick={handleClockOut}
              disabled={processing}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {processing ? "Processing..." : "CLOCK OUT"}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="text-lg font-semibold text-gray-500">NOT CLOCKED IN</span>
            </div>
            <p className="text-gray-400 text-sm mb-6">Tap the button to start your shift</p>
            {statusText && <p className={`text-sm font-medium mb-4 ${statusColor}`}>{statusText}</p>}
            <button
              onClick={handleClockIn}
              disabled={processing}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {processing ? "Processing..." : "CLOCK IN"}
            </button>
          </>
        )}
      </div>

      {/* Today's log */}
      {todayEntries.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Today&apos;s Attendance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs font-semibold text-gray-500">#</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500">Clock In</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500">Clock Out</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500">Duration</th>
                </tr>
              </thead>
              <tbody>
                {todayEntries.map((e, i) => {
                  const dur = e.clockOut
                    ? (() => {
                        const m = Math.round((new Date(e.clockOut).getTime() - new Date(e.clockIn).getTime()) / 60000);
                        return `${Math.floor(m / 60)}h ${m % 60}m`;
                      })()
                    : "In progress";
                  return (
                    <tr key={e.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 text-gray-400">{i + 1}</td>
                      <td className="py-2 font-medium text-gray-800">{formatTime(e.clockIn)}</td>
                      <td className="py-2 text-gray-600">{e.clockOut ? formatTime(e.clockOut) : <span className="text-green-600 text-xs font-medium">Active</span>}</td>
                      <td className="py-2 text-gray-500">{dur}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
