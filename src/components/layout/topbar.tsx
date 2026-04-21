"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Menu, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import Link from "next/link";

interface TopbarProps {
  title?: string;
  user?: {
    name: string;
    email: string;
    role?: string;
  };
}

export function Topbar({ title, user }: TopbarProps) {
  const { theme, setTheme } = useTheme();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar user={user} />
          </SheetContent>
        </Sheet>
        {title && (
          <h1 className="text-lg font-semibold text-gray-900">
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
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button className="relative inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-gray-100 transition-colors" aria-label="Notifications">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-sm text-gray-900">Notifications</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <div className="text-center py-8 text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-blue-600 text-white text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-sm">{user?.name || "User"}</p>
                <p className="text-xs text-gray-500">{user?.email || ""}</p>
              </div>
            </div>
            <DropdownMenuItem>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer w-full">
                <User className="w-4 h-4" />
                Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
