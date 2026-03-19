"use client";

import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Moon, Sun, Menu, LogOut, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface TopbarProps {
  title?: string;
}

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function Topbar({ title }: TopbarProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const user = session?.user as any;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/notifications/me");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setNotifications(data);
      }
    } catch {}
  }, [session?.user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/employee/profile")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.profilePhoto) setProfilePhoto(data.profilePhoto); })
      .catch(() => {});
  }, [session?.user]);

  async function markAllRead() {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  }

  async function markOneRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {}
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
        {title && (
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notification Bell */}
        <DropdownMenu open={notifOpen} onOpenChange={(o) => { setNotifOpen(o); if (o) fetchNotifications(); }}>
          <DropdownMenuTrigger>
            <button className="relative inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Notifications">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markOneRead(n.id)}
                    className={`flex gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      !n.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    {/* Dot indicator */}
                    <div className="mt-1.5 flex-shrink-0">
                      {!n.read ? (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.read ? "font-medium text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(n.createdAt).toLocaleDateString("en-PH", {
                          month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 text-center">
                <Link
                  href="/notifications"
                  className="text-xs text-blue-600 hover:underline font-medium"
                  onClick={() => setNotifOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-sm">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <a href="/settings" className="flex items-center gap-2 cursor-pointer w-full">
                <User className="w-4 h-4" />
                Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 text-red-600 dark:text-red-400 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
