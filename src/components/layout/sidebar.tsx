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
  Users,
  Activity,
  Plane,
  ClipboardCheck,
  Lock,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { hasFeatureAccess, TIER_COLORS, TIER_LABELS, type Tier, type Feature } from "@/lib/tier";

// ─── Admin Nav Structure ───────────────────────────────────────────────────────

const adminSections = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, feature: null },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/employees", label: "Employees", icon: Users, feature: null },
      { href: "/attendance", label: "Attendance", icon: Activity, feature: null },
      { href: "/performance", label: "Performance", icon: TrendingUp, feature: null },
      { href: "/leave", label: "Leave Management", icon: Plane, feature: null },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/scheduling", label: "Scheduling", icon: Calendar, feature: "scheduling" as const },
      { href: "/approvals", label: "Approvals", icon: ClipboardCheck, feature: null },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/payroll", label: "Payroll", icon: DollarSign, feature: "payroll" as const },
      { href: "/reports", label: "Reports", icon: BarChart2, feature: "reports" as const },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/notifications", label: "Notifications", icon: Bell, feature: "notifications" as const },
      { href: "/settings", label: "Settings", icon: Settings, feature: null },
    ],
  },
];

// ─── Employee Nav Structure ────────────────────────────────────────────────────

import {
  Activity as ActivityIcon,
  Plane as PlaneIcon,
  ClipboardList as ClipboardListIcon,
  User as UserIcon,
} from "lucide-react";

const employeeSections = [
  {
    title: "Overview",
    items: [
      { href: "/employee-dashboard", label: "My Dashboard", icon: LayoutDashboard, feature: null },
    ],
  },
  {
    title: "My Work",
    items: [
      { href: "/my-schedule", label: "My Schedule", icon: Calendar, feature: null },
      { href: "/clock", label: "Clock In/Out", icon: Clock, feature: null },
      { href: "/my-attendance", label: "Attendance History", icon: ActivityIcon, feature: null },
    ],
  },
  {
    title: "My Requests",
    items: [
      { href: "/my-requests", label: "Requests", icon: ClipboardListIcon, feature: null },
      { href: "/my-leave", label: "Leave", icon: PlaneIcon, feature: null },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/my-payslips", label: "My Payslips", icon: DollarSign, feature: null },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/my-profile", label: "My Profile", icon: UserIcon, feature: null },
      { href: "/notifications", label: "Notifications", icon: Bell, feature: "notifications" as const },
    ],
  },
];

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 px-3 pt-5 pb-1 first:pt-2">
      {title}
    </p>
  );
}

// ─── Nav Link ─────────────────────────────────────────────────────────────────

function NavLink({
  href,
  label,
  icon: Icon,
  feature,
  tier,
  pathname,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  feature: string | null;
  tier: string;
  pathname: string;
}) {
  const isActive = pathname === href;
  const validTier: Tier = (["FREE", "PRO", "ADVANCED"] as Tier[]).includes(tier as Tier) ? (tier as Tier) : "FREE";
  const hasAccess = !feature || hasFeatureAccess(validTier, feature as Feature);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
        !hasAccess && "opacity-60"
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {!hasAccess && <Lock className="w-3 h-3" />}
    </Link>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const tier = (session?.user as any)?.tier || "FREE";
  const role = (session?.user as any)?.role || "EMPLOYEE";
  const isAdmin = role === "MANAGER" || role === "HR";

  const sections = isAdmin ? adminSections : employeeSections;

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="font-bold text-xl text-gray-900 dark:text-white">WorkForce</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        {sections.map((section, sIdx) => (
          <div key={section.title}>
            <SectionHeader title={section.title} />
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  feature={item.feature}
                  tier={tier}
                  pathname={pathname}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: role + plan badges */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Role:</span>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              isAdmin
                ? "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300"
                : "border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400"
            )}
          >
            {role}
          </Badge>
        </div>
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
