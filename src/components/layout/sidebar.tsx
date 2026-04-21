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

// Simple navigation structure
const navSections = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/announcements", label: "Announcements", icon: Megaphone },
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
    title: "System",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
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
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  pathname: string;
}) {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-blue-50 text-blue-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1">{label}</span>
    </Link>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

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
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="font-bold text-xl text-gray-900">WorkForce</span>
        </Link>
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
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-blue-600" />
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
