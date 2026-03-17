"use client";

import { useState } from "react";
import { Bell, CheckCheck, AlertTriangle, DollarSign, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsClientProps {
  notifications: Notification[];
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  SHIFT_APPROVED: Calendar,
  SHIFT_REQUEST: Calendar,
  PAYROLL_READY: DollarSign,
  OVERTIME_ALERT: AlertTriangle,
  DEFAULT: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  SHIFT_APPROVED: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
  SHIFT_REQUEST: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
  PAYROLL_READY: "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800",
  OVERTIME_ALERT: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800",
  DEFAULT: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
};

const ICON_COLORS: Record<string, string> = {
  SHIFT_APPROVED: "text-green-600",
  SHIFT_REQUEST: "text-blue-600",
  PAYROLL_READY: "text-emerald-600",
  OVERTIME_ALERT: "text-orange-600",
  DEFAULT: "text-gray-600",
};

export function NotificationsClient({ notifications: initial }: NotificationsClientProps) {
  const [notifications, setNotifications] = useState(initial);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      toast.error("Failed to mark as read.");
    }
  }

  async function markAllAsRead() {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Notifications
          </h2>
          {unreadCount > 0 && (
            <Badge className="bg-blue-600 text-white">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={markingAll}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">No notifications yet</p>
            <p className="text-sm text-gray-400 mt-1">
              You'll see shift updates, payroll alerts, and more here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] || TYPE_ICONS.DEFAULT;
            const colorClass = TYPE_COLORS[n.type] || TYPE_COLORS.DEFAULT;
            const iconColor = ICON_COLORS[n.type] || ICON_COLORS.DEFAULT;

            return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                  colorClass,
                  !n.read && "ring-1 ring-blue-500/20"
                )}
                onClick={() => !n.read && markAsRead(n.id)}
              >
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white dark:bg-gray-900", iconColor)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm text-gray-900 dark:text-white", !n.read && "font-medium")}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
