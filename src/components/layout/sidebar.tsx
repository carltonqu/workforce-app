"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Clock,
  Calendar,
  DollarSign,
  BarChart2,
  Bell,
  Settings,
  LayoutDashboard,
  Lock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { hasFeatureAccess, TIER_COLORS, TIER_LABELS } from "@/lib/tier";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    feature: null,
    adminOnly: false,
  },
  {
    href: "/employees",
    label: "Employees",
    icon: Users,
    feature: null,
    adminOnly: true,
  },
  {
    href: "/time-tracking",
    label: "Time Tracking",
    icon: Clock,
    feature: "time-tracking" as const,
    adminOnly: false,
  },
  {
    href: "/scheduling",
    label: "Scheduling",
    icon: Calendar,
    feature: "scheduling" as const,
    requiredTier: "PRO",
    adminOnly: false,
  },
  {
    href: "/payroll",
    label: "Payroll",
    icon: DollarSign,
    feature: "payroll" as const,
    requiredTier: "ADVANCED",
    adminOnly: false,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart2,
    feature: "reports" as const,
    requiredTier: "ADVANCED",
    adminOnly: false,
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    feature: "notifications" as const,
    requiredTier: "PRO",
    adminOnly: false,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    feature: null,
    adminOnly: false,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const tier = (session?.user as any)?.tier || "FREE";
  const role = (session?.user as any)?.role || "EMPLOYEE";
  const isAdmin = role === "MANAGER" || role === "HR";

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-screen">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-white">
            WorkForce
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 pb-4 space-y-1">
        {navItems.map((item) => {
          // Hide admin-only items from non-admins
          if (item.adminOnly && !isAdmin) return null;

          const isActive = pathname === item.href;
          const hasAccess =
            !item.feature || hasFeatureAccess(tier, item.feature);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
                !hasAccess && "opacity-60"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {!hasAccess && <Lock className="w-3 h-3" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Plan:</span>
          <Badge
            className={cn("text-xs", TIER_COLORS[tier as keyof typeof TIER_COLORS])}
            variant="outline"
          >
            {TIER_LABELS[tier as keyof typeof TIER_LABELS]}
          </Badge>
        </div>
      </div>
    </aside>
  );
}
