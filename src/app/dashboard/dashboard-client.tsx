"use client";

import Link from "next/link";
import { Clock, Calendar, DollarSign, Bell, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hasFeatureAccess, TIER_COLORS, TIER_LABELS } from "@/lib/tier";
import { formatDistanceToNow } from "date-fns";

interface DashboardClientProps {
  user: any;
  stats: {
    totalHours: number;
    overtimeHours: number;
    unreadNotifications: number;
    lastPayroll: number | null;
  };
  recentEntries: any[];
  notifications: any[];
  isCurrentlyClockedIn: boolean;
}

export function DashboardClient({
  user,
  stats,
  recentEntries,
  notifications,
  isCurrentlyClockedIn,
}: DashboardClientProps) {
  const tier = user.tier || "FREE";

  const quickActions = [
    {
      href: "/time-tracking",
      icon: Clock,
      label: isCurrentlyClockedIn ? "Clock Out" : "Clock In",
      description: isCurrentlyClockedIn ? "You're currently clocked in" : "Start your shift",
      color: isCurrentlyClockedIn ? "text-green-600" : "text-blue-600",
      bg: isCurrentlyClockedIn ? "bg-green-50 dark:bg-green-950" : "bg-blue-50 dark:bg-blue-950",
      locked: false,
    },
    {
      href: "/scheduling",
      icon: Calendar,
      label: "View Schedule",
      description: "This week's shifts",
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
      locked: !hasFeatureAccess(tier, "scheduling"),
    },
    {
      href: "/payroll",
      icon: DollarSign,
      label: "Payroll",
      description: "View earnings summary",
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950",
      locked: !hasFeatureAccess(tier, "payroll"),
    },
    {
      href: "/notifications",
      icon: Bell,
      label: "Notifications",
      description: `${stats.unreadNotifications} unread`,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950",
      locked: !hasFeatureAccess(tier, "notifications"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user.name?.split(" ")[0] ?? "there"}! 👋
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Badge variant="outline" className={TIER_COLORS[tier as keyof typeof TIER_COLORS]}>
          {TIER_LABELS[tier as keyof typeof TIER_LABELS]} Plan
        </Badge>
      </div>

      {/* Status banner if clocked in */}
      {isCurrentlyClockedIn && (
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            You're currently clocked in
          </p>
          <Link href="/time-tracking" className="ml-auto">
            <Button size="sm" variant="outline" className="text-green-700 border-green-300">
              Clock Out
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Hours This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalHours}h
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Overtime Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.overtimeHours}h
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Notifications</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.unreadNotifications}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Payroll</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.lastPayroll !== null
                    ? `$${stats.lastPayroll.toFixed(0)}`
                    : "—"}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-50 dark:bg-green-950 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`relative p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md transition-all ${
                action.locked ? "opacity-70" : ""
              }`}
            >
              <div className={`w-10 h-10 ${action.bg} rounded-lg flex items-center justify-center mb-3`}>
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <p className="font-medium text-sm text-gray-900 dark:text-white">
                {action.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {action.description}
              </p>
              {action.locked && (
                <span className="absolute top-2 right-2 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                  Locked
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Time Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Recent Time Entries
              <Link href="/time-tracking" className="text-xs text-blue-600 font-normal">
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No time entries yet this month</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEntries.map((entry) => {
                  const duration = entry.clockOut
                    ? Math.floor(
                        (new Date(entry.clockOut).getTime() -
                          new Date(entry.clockIn).getTime()) /
                          3600000
                      )
                    : null;
                  return (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="flex items-center gap-2">
                        {entry.clockOut ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(entry.clockIn).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(entry.clockIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            {entry.clockOut && ` — ${new Date(entry.clockOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {duration !== null ? `${duration}h` : "Active"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Notifications
              <Link href="/notifications" className="text-xs text-blue-600 font-normal">
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No unread notifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
