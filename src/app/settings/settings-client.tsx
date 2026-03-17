"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Crown, User, Building2, Shield } from "lucide-react";

interface SettingsClientProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    tier: string;
    orgId: string | null;
  };
  org: {
    id: string;
    name: string;
    tier: string;
  } | null;
}

const tierColors: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  PRO: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ADVANCED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

const tierFeatures: Record<string, string[]> = {
  FREE: ["⏱️ Smart Time Tracking", "🔒 Role-Based Access"],
  PRO: ["⏱️ Smart Time Tracking", "📅 Drag & Drop Scheduling", "🔔 Smart Notifications", "🔒 Role-Based Access"],
  ADVANCED: [
    "⏱️ Smart Time Tracking",
    "📅 Drag & Drop Scheduling",
    "💰 Automated Payroll",
    "📊 Analytics & Reports",
    "🔔 Smart Notifications",
    "🔒 Role-Based Access",
  ],
};

export function SettingsClient({ user, org }: SettingsClientProps) {
  const tier = user.tier || "FREE";
  const features = tierFeatures[tier] || tierFeatures.FREE;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user.name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant="outline">{user.role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization */}
      {org && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{org.name}</p>
          </CardContent>
        </Card>
      )}

      {/* Tier / Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Current Plan
          </CardTitle>
          <CardDescription>Features available on your plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${tierColors[tier]}`}
            >
              {tier}
            </span>
          </div>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground mb-2">Included features:</p>
            <ul className="space-y-1">
              {features.map((f) => (
                <li key={f} className="text-sm flex items-center gap-2">
                  <span className="text-green-500">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
          {tier !== "ADVANCED" && (
            <>
              <Separator />
              <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-4">
                <p className="text-sm font-medium">
                  {tier === "FREE" ? "Upgrade to Pro or Advanced" : "Upgrade to Advanced"} to unlock more features
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Contact your administrator to upgrade your plan.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions
          </CardTitle>
          <CardDescription>Based on your role: {user.role}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {user.role === "MANAGER" && (
              <>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Manage employees & schedules</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Approve timesheets & payroll</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> View all reports</li>
              </>
            )}
            {user.role === "HR" && (
              <>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Manage employee records</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> View payroll summaries</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> View attendance reports</li>
              </>
            )}
            {user.role === "EMPLOYEE" && (
              <>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Clock in / clock out</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> View own schedule</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> View own payslips</li>
              </>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
