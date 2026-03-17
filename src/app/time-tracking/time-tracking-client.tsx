"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Play, Square, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TimeEntry {
  id: string;
  userId: string;
  clockIn: string;
  clockOut: string | null;
  overtimeMinutes: number;
}

interface TimeTrackingClientProps {
  userId: string;
  activeEntry: TimeEntry | null;
  recentEntries: TimeEntry[];
}

const OVERTIME_HOURS = 8;

export function TimeTrackingClient({
  userId,
  activeEntry: initialEntry,
  recentEntries: initialEntries,
}: TimeTrackingClientProps) {
  const [activeEntry, setActiveEntry] = useState(initialEntry);
  const [entries, setEntries] = useState(initialEntries);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (activeEntry) {
        const seconds = Math.floor(
          (Date.now() - new Date(activeEntry.clockIn).getTime()) / 1000
        );
        setElapsed(seconds);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeEntry]);

  // Init elapsed on mount
  useEffect(() => {
    if (activeEntry) {
      setElapsed(
        Math.floor(
          (Date.now() - new Date(activeEntry.clockIn).getTime()) / 1000
        )
      );
    }
  }, [activeEntry]);

  function formatElapsed(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function formatDuration(entry: TimeEntry) {
    if (!entry.clockOut) return "Active";
    const minutes = Math.floor(
      (new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) /
        60000
    );
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  }

  const isOvertime = elapsed > OVERTIME_HOURS * 3600;
  const hoursElapsed = elapsed / 3600;

  async function handleClockIn() {
    setLoading(true);
    try {
      const res = await fetch("/api/time-entries/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to clock in");
      const entry = await res.json();
      setActiveEntry(entry);
      setElapsed(0);
      toast.success("Clocked in successfully!");
    } catch {
      toast.error("Failed to clock in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleClockOut() {
    if (!activeEntry) return;
    setLoading(true);
    try {
      const res = await fetch("/api/time-entries/clock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: activeEntry.id }),
      });
      if (!res.ok) throw new Error("Failed to clock out");
      const entry = await res.json();
      setActiveEntry(null);
      setEntries((prev) => [entry, ...prev]);
      setElapsed(0);
      if (entry.overtimeMinutes > 0) {
        toast.warning(
          `Clocked out. You had ${entry.overtimeMinutes} minutes of overtime.`
        );
      } else {
        toast.success("Clocked out successfully!");
      }
    } catch {
      toast.error("Failed to clock out. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const progressPct = Math.min((hoursElapsed / OVERTIME_HOURS) * 100, 100);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Main clock card */}
      <Card className="text-center overflow-hidden">
        <CardContent className="pt-10 pb-8 space-y-6">
          {/* Clock display */}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-5xl font-mono font-bold text-gray-900 dark:text-white tracking-tight">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </div>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2">
            {activeEntry ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                  Clocked In
                </Badge>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <Badge variant="outline" className="text-gray-500">
                  Not Working
                </Badge>
              </>
            )}
          </div>

          {/* Timer */}
          {activeEntry && (
            <div className="space-y-3">
              <p
                className={`text-4xl font-mono font-semibold ${
                  isOvertime
                    ? "text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {formatElapsed(elapsed)}
              </p>

              {isOvertime && (
                <div className="flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  Overtime detected ({Math.floor((elapsed - OVERTIME_HOURS * 3600) / 60)} min)
                </div>
              )}

              {/* Progress bar */}
              <div className="mx-auto max-w-xs">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>0h</span>
                  <span>{OVERTIME_HOURS}h (standard)</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOvertime
                        ? "bg-red-500"
                        : "bg-blue-500"
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Clock in/out button */}
          {activeEntry ? (
            <Button
              size="lg"
              onClick={handleClockOut}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-10 py-6 text-lg rounded-full"
            >
              <Square className="w-5 h-5 mr-2" />
              Clock Out
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleClockIn}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 text-lg rounded-full"
            >
              <Play className="w-5 h-5 mr-2" />
              Clock In
            </Button>
          )}

          {activeEntry && (
            <p className="text-xs text-gray-400">
              Started at{" "}
              {new Date(activeEntry.clockIn).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No time entries yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(entry.clockIn).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.clockIn).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" — "}
                        {entry.clockOut
                          ? new Date(entry.clockOut).toLocaleTimeString(
                              "en-US",
                              { hour: "2-digit", minute: "2-digit" }
                            )
                          : "Active"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDuration(entry)}
                    </p>
                    {entry.overtimeMinutes > 0 && (
                      <p className="text-xs text-orange-500">
                        +{entry.overtimeMinutes}m OT
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
