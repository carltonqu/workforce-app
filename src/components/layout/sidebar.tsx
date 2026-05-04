"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  DollarSign,
  Settings,
  LayoutDashboard,
  Users,
  Activity,
  Plane,
  ClipboardCheck,
  TrendingUp,
  Megaphone,
  Package,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Briefcase,
  Bell,
  FileText,
  ClipboardList,
  Clock,
  BarChart3,
  Shield,
  CheckSquare,
  UserCheck,
  Wallet,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    role?: string;
  };
}

// Define navigation items for each role
type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

// Admin Navigation (Full Access)
const adminNavSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/announcements", label: "Announcements", icon: Megaphone },
      { href: "/ai-insights", label: "AI Insights", icon: BarChart3 },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/employees", label: "Employees", icon: Users },
      { href: "/attendance", label: "Attendance", icon: Activity },
      { href: "/performance", label: "Performance", icon: TrendingUp },
      { href: "/leave", label: "Leave Management", icon: Plane },
      { href: "/supervisor-assignments", label: "Supervisor Assignments", icon: ShieldCheck },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/scheduling", label: "Scheduling", icon: Calendar },
      { href: "/approvals", label: "Approvals", icon: ClipboardCheck },
      { href: "/assets", label: "Assets", icon: Package },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/payroll", label: "Payroll", icon: DollarSign },
      { href: "/finance", label: "Finance Summary", icon: TrendingUp },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/dashboard/admin", label: "Admin Panel", icon: Shield },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

// Supervisor Navigation (Limited Access)
const supervisorNavSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard/supervisor", label: "Dashboard", icon: LayoutDashboard },
      { href: "/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  {
    title: "My Team",
    items: [
      { href: "/employees", label: "My Team", icon: Users },
      { href: "/supervisor-assignments", label: "Tasks", icon: ClipboardList },
      { href: "/attendance", label: "Attendance (Team)", icon: Activity },
      { href: "/leave", label: "Leave Approvals", icon: CheckSquare },
    ],
  },
  {
    title: "Reports",
    items: [
      { href: "/performance", label: "Performance", icon: TrendingUp },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

// Employee Navigation (Personal Only)
const employeeNavSections: NavSection[] = [
  {
    title: "My Workspace",
    items: [
      { href: "/dashboard/employee", label: "Dashboard", icon: Home },
      { href: "/clock", label: "Attendance", icon: Clock },
      { href: "/my-assets", label: "My Assets", icon: Package },
    ],
  },
  {
    title: "Requests",
    items: [
      { href: "/my-requests", label: "Request Leave", icon: Plane },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Personal",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/my-profile", label: "Profile", icon: UserIcon },
    ],
  },
];

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-3 pt-5 pb-1 first:pt-2">
      {title}
    </p>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  roleColor,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  pathname: string;
  roleColor: string;
}) {
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? `${roleColor} bg-opacity-10`
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? roleColor.replace("bg-", "text-").replace("-50", "-700") : "text-gray-400")} />
      <span className="flex-1">{label}</span>
    </Link>
  );
}

function RoleBadge({ role }: { role?: string }) {
  const badges: Record<string, { label: string; color: string; bg: string }> = {
    MANAGER: { label: "Admin", color: "text-blue-700", bg: "bg-blue-100" },
    HR: { label: "HR", color: "text-blue-700", bg: "bg-blue-100" },
    SUPERVISOR: { label: "Supervisor", color: "text-purple-700", bg: "bg-purple-100" },
    EMPLOYEE: { label: "Employee", color: "text-emerald-700", bg: "bg-emerald-100" },
  };

  const badge = badges[role || "EMPLOYEE"];

  return (
    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${badge.bg} ${badge.color}`}>
      {badge.label}
    </span>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine role and navigation
  const role = user?.role || "EMPLOYEE";
  const isAdmin = role === "MANAGER" || role === "HR";
  const isSupervisor = role === "SUPERVISOR" || role === "MANAGER" || role === "HR";

  let navSections: NavSection[];
  let roleColor: string;
  let roleGradient: string;

  if (isAdmin) {
    navSections = adminNavSections;
    roleColor = "bg-blue-50 text-blue-700";
    roleGradient = "from-blue-600 to-blue-500";
  } else if (isSupervisor) {
    navSections = supervisorNavSections;
    roleColor = "bg-purple-50 text-purple-700";
    roleGradient = "from-purple-600 to-purple-500";
  } else {
    navSections = employeeNavSections;
    roleColor = "bg-emerald-50 text-emerald-700";
    roleGradient = "from-emerald-600 to-emerald-500";
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to logout");
    }
  }

  return (
    <aside className="flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className={`w-8 h-8 bg-gradient-to-br ${roleGradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div>
            <span className="font-bold text-xl text-gray-900">ClockRoster</span>
          </div>
        </Link>
      </div>

      {/* Role Indicator */}
      <div className="px-4 py-2 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Your Role</span>
          <RoleBadge role={role} />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title}>
            <SectionHeader title={section.title} />
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  pathname={pathname}
                  roleColor={roleColor}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isAdmin ? "bg-blue-100" : isSupervisor ? "bg-purple-100" : "bg-emerald-100"
          }`}>
            <UserIcon className={`w-5 h-5 ${
              isAdmin ? "text-blue-600" : isSupervisor ? "text-purple-600" : "text-emerald-600"
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
