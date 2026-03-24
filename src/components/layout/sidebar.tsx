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
  Megaphone,
  Package,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { hasFeatureAccess, TIER_COLORS, TIER_LABELS, trialDaysLeft, type Tier, type Feature } from "@/lib/tier";

// ─── Admin Nav Structure ───────────────────────────────────────────────────────

const adminSections = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, feature: null },
      { href: "/announcements", label: "Announcements", icon: Megaphone, feature: null },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/employees", label: "Employees", icon: Users, feature: null },
      { href: "/attendance", label: "Attendance", icon: Activity, feature: null },
      { href: "/performance", label: "Performance", icon: TrendingUp, feature: null },
      { href: "/leave", label: "Leave Management", icon: Plane, feature: null },
      { href: "/supervisor-assignments", label: "Supervisor Assignments", icon: ShieldCheck, feature: null },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/scheduling", label: "Scheduling", icon: Calendar, feature: "scheduling" as const },
      { href: "/approvals", label: "Approvals", icon: ClipboardCheck, feature: null },
      { href: "/assets", label: "Assets", icon: Package, feature: null },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/payroll", label: "Payroll", icon: DollarSign, feature: "payroll" as const },
      { href: "/finance", label: "Finance Summary", icon: TrendingUp, feature: null },
    ],
  },
  {
    title: "System",
    items: [
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

const supervisorSections = [
  {
    title: "Overview",
    items: [
      { href: "/supervisor-dashboard", label: "Supervisor Dashboard", icon: LayoutDashboard, feature: null },
      { href: "/announcements", label: "Announcements", icon: Megaphone, feature: null },
    ],
  },
  {
    title: "Team Operations",
    items: [
      { href: "/attendance", label: "Attendance", icon: Activity, feature: null },
      { href: "/performance", label: "Performance", icon: TrendingUp, feature: null },
      { href: "/leave", label: "Leave Approvals", icon: Plane, feature: null },
      { href: "/scheduling", label: "Scheduling", icon: Calendar, feature: "scheduling" as const },
      { href: "/assets", label: "Assets", icon: Package, feature: null },
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
      { href: "/my-assets", label: "My Assets", icon: Package, feature: null },
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
    ],
  },
];

const employeeSections = [
  {
    title: "Overview",
    items: [
      { href: "/employee-dashboard", label: "My Dashboard", icon: LayoutDashboard, feature: null },
      { href: "/announcements", label: "Announcements", icon: Megaphone, feature: null },
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
      { href: "/my-assets", label: "My Assets", icon: Package, feature: null },
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
    ],
  },
];

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-3 pt-5 pb-1 first:pt-2">
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
          ? "bg-blue-50 text-blue-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
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
  const isSupervisor = (session?.user as any)?.isSupervisor === true;
  const trialEndsAt = (session?.user as any)?.trialEndsAt ?? null;
  const daysLeft = trialDaysLeft(trialEndsAt);
  const showTrialBadge = tier === "FREE" && daysLeft > 0;

  const sections = isAdmin ? adminSections : isSupervisor ? supervisorSections : employeeSections;

  return (
    <aside className="flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="font-bold text-xl text-gray-900">WorkForce</span>
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

      {/* Bottom plan card */}
      <div className="p-3 border-t border-gray-200">

        {/* Plan card */}
        <Link href="/settings">
          <div className={cn(
            "rounded-xl px-3 py-2.5 mb-2 cursor-pointer transition hover:opacity-90",
            tier === "ADVANCED"
              ? "bg-gradient-to-r from-purple-500 to-purple-700 text-white"
              : tier === "PRO"
              ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
              : "bg-gray-50 border border-gray-200"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-[10px] font-semibold uppercase tracking-widest", tier === "FREE" ? "text-gray-400" : "text-white/70")}>
                  Current Plan
                </p>
                <p className={cn("text-sm font-bold mt-0.5", tier === "FREE" ? "text-gray-800" : "text-white")}>
                  {TIER_LABELS[tier as keyof typeof TIER_LABELS] ?? tier}
                </p>
                {tier === "FREE" && daysLeft > 0 && (
                  <p className="text-[10px] text-orange-500 font-medium mt-0.5">⏱ {daysLeft} days left</p>
                )}
                {tier === "FREE" && daysLeft === 0 && (
                  <p className="text-[10px] text-red-500 font-medium mt-0.5">Trial expired</p>
                )}
                {tier === "ADVANCED" && (
                  <p className="text-[10px] text-white/70 mt-0.5">Full access</p>
                )}
                {tier === "PRO" && (
                  <p className="text-[10px] text-white/70 mt-0.5">Core features</p>
                )}
              </div>
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0",
                tier === "ADVANCED" ? "bg-white/20" : tier === "PRO" ? "bg-white/20" : "bg-gray-200"
              )}>
                {tier === "ADVANCED" ? "👑" : tier === "PRO" ? "⚡" : "🔒"}
              </div>
            </div>
            {tier !== "ADVANCED" && (
              <p className={cn("text-[10px] mt-1.5 font-medium", tier === "FREE" ? "text-blue-600" : "text-white/80")}>
                {tier === "FREE" ? "Upgrade to unlock more →" : "Upgrade to Advanced →"}
              </p>
            )}
          </div>
        </Link>

        {/* Role badge */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-gray-400">Role:</span>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              isAdmin ? "border-blue-300 text-blue-700" : "border-gray-300 text-gray-500"
            )}
          >
            {role}
          </Badge>
        </div>
      </div>
    </aside>
  );
}
