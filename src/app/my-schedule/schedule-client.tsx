"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface Shift {
  id: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  shiftName?: string;
  location?: string;
  isRestDay?: number;
  isHoliday?: number;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ScheduleClient() {
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [upcoming, setUpcoming] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  const weekEnd = addDays(weekStart, 6);
  const from = toISODate(weekStart);
  const to = toISODate(addDays(weekStart, 27));

  useEffect(() => {
    setLoading(true);
    const weekEndStr = toISODate(addDays(weekStart, 6));
    fetch(`/api/employee/shifts?from=${from}&to=${to}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const thisWeek = data.filter((s: Shift) => s.date >= from && s.date <= weekEndStr);
          setShifts(thisWeek);

          const todayStr = toISODate(new Date());
          const upcomingShifts = data.filter((s: Shift) => s.date > todayStr).slice(0, 14);
          setUpcoming(upcomingShifts);
        }
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  function prevWeek() { setWeekStart(d => addDays(d, -7)); }
  function nextWeek() { setWeekStart(d => addDays(d, 7)); }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const shiftMap = new Map(shifts.map(s => [s.date, s]));
  const today = toISODate(new Date());

  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="space-y-6">
      {/* Header + navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-600" /> My Schedule
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={prevWeek} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700">{weekLabel}</span>
          <button onClick={nextWeek} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Weekly grid */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS.map((day, i) => {
                const date = weekDays[i];
                const isToday = toISODate(date) === today;
                return (
                  <div key={day} className={`px-2 py-3 text-center border-r border-gray-50 last:border-0 ${isToday ? "bg-blue-50" : ""}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${isToday ? "text-blue-600" : "text-gray-400"}`}>{day}</p>
                    <p className={`text-lg font-bold mt-0.5 ${isToday ? "text-blue-700" : "text-gray-700"}`}>{date.getDate()}</p>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 min-h-[120px]">
              {weekDays.map((date) => {
                const dateStr = toISODate(date);
                const shift = shiftMap.get(dateStr);
                const isToday = dateStr === today;
                return (
                  <div key={dateStr} className={`px-2 py-3 border-r border-gray-50 last:border-0 ${isToday ? "bg-blue-50/50" : ""}`}>
                    {shift ? (
                      shift.isRestDay ? (
                        <div className="bg-gray-100 rounded-lg p-2 text-center">
                          <p className="text-xs font-medium text-gray-500">Rest Day</p>
                        </div>
                      ) : shift.isHoliday ? (
                        <div className="bg-red-50 rounded-lg p-2 text-center">
                          <p className="text-xs font-medium text-red-500">Holiday</p>
                          {shift.shiftName && <p className="text-xs text-red-400 mt-0.5">{shift.shiftName}</p>}
                        </div>
                      ) : (
                        <div className="bg-blue-600 rounded-lg p-2 text-white">
                          <p className="text-xs font-semibold truncate">{shift.shiftName || "Regular"}</p>
                          <p className="text-xs mt-0.5 opacity-90">{shift.shiftStart}</p>
                          <p className="text-xs opacity-80">{shift.shiftEnd}</p>
                          {shift.location && <p className="text-xs opacity-70 truncate mt-0.5">📍 {shift.location}</p>}
                        </div>
                      )
                    ) : (
                      <div className="h-full" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming shifts */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Upcoming Shifts</h2>
            {upcoming.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No schedule assigned yet. Contact your HR or manager.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{new Date(s.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.shiftName || "Regular"}{s.location ? ` · 📍 ${s.location}` : ""}</p>
                    </div>
                    <div className="text-right">
                      {s.isRestDay ? (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Rest Day</span>
                      ) : s.isHoliday ? (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">Holiday</span>
                      ) : (
                        <span className="text-sm font-medium text-blue-600">{s.shiftStart} – {s.shiftEnd}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
