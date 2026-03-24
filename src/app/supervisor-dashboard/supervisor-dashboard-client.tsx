"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, TrendingUp, Plane, Calendar, Package, Megaphone } from "lucide-react";

const ITEMS = [
  { href: "/attendance", label: "Attendance Monitoring", icon: Activity, desc: "Track attendance and punctuality." },
  { href: "/performance", label: "Performance", icon: TrendingUp, desc: "Monitor team performance metrics." },
  { href: "/leave", label: "Leave Approvals", icon: Plane, desc: "Review and approve leave requests." },
  { href: "/scheduling", label: "Scheduling", icon: Calendar, desc: "Plan and manage shifts." },
  { href: "/assets", label: "Assets", icon: Package, desc: "Manage team assets and assignments." },
  { href: "/announcements", label: "Announcements", icon: Megaphone, desc: "View and post team updates." },
];

export function SupervisorDashboardClient() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Supervisor Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          You only have access to supervisor modules. Financial reports are intentionally hidden.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full hover:border-blue-300 transition">
                <CardContent className="p-5 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.label}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
