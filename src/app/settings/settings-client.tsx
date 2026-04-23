"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Crown, User, Building2, Shield, Zap, Check, AlertTriangle, Loader2, ExternalLink, Clock,
  Sparkles, CreditCard, Package
} from "lucide-react";
import { trialDaysLeft, isTrialExpired } from "@/lib/tier";
import { ResetEmployeesButton } from "@/components/reset-employees-button";

interface SettingsClientProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    tier: string;
    orgId: string | null;
    trialEndsAt?: string | null;
    stripeStatus?: string | null;
  };
  org: {
    id: string;
    name: string;
    tier: string;
    stripeCustomerId?: string | null;
    stripeStatus?: string | null;
    trialEndsAt?: string | null;
  } | null;
  trialExpired?: boolean;
}

const PLANS = [
  {
    id: "PRO" as const,
    name: "Pro",
    price: "$29/mo",
    color: "from-blue-500 to-cyan-500",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    features: [
      "Employee management",
      "Attendance & performance monitoring",
      "Announcements",
      "Approval workflows (leave, requests)",
      "Asset management",
      "Scheduling",
      "Smart notifications",
    ],
    excluded: ["Payroll", "Finance reports"],
  },
  {
    id: "ADVANCED" as const,
    name: "Advanced",
    price: "$59/mo",
    color: "from-purple-500 to-pink-500",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    features: [
      "Everything in Pro",
      "Automated Payroll",
      "Finance reports",
      "Full system access",
    ],
    excluded: [],
  },
];

export function SettingsClient({ user, org, trialExpired }: SettingsClientProps) {
  const tier = user.tier || "FREE";
  const role = user.role || "EMPLOYEE";
  const isAdmin = role === "MANAGER" || role === "HR";
  const trialEndsAt = org?.trialEndsAt ?? user.trialEndsAt ?? null;
  const stripeStatus = org?.stripeStatus ?? user.stripeStatus ?? null;
  const daysLeft = trialDaysLeft(trialEndsAt);
  const expired = trialExpired || isTrialExpired(tier as any, trialEndsAt, stripeStatus);
  const hasActiveSub = org?.stripeCustomerId && stripeStatus === "active";

  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleCheckout(plan: "PRO" | "ADVANCED") {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url && data.url.startsWith("https://")) {
        window.location.href = data.url;
      } else {
        alert(data.error || `Checkout error: ${JSON.stringify(data)}`);
      }
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Trial expired banner */}
      {expired && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-5 flex items-start gap-4 animate-fade-in-up">
          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">Your free trial has expired</p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
              Upgrade to Pro or Advanced to continue using the app.
            </p>
          </div>
        </div>
      )}

      {/* Trial active banner */}
      {!expired && tier === "FREE" && daysLeft > 0 && (
        <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-5 flex items-center gap-4 animate-fade-in-up">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              Free trial — {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Upgrade before your trial ends to keep full access.</p>
          </div>
        </div>
      )}

      {/* User Info */}
      <Card className="border-gray-100 dark:border-gray-800 shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Account</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 dark:text-gray-400">Name</span>
            <span className="font-medium text-gray-900 dark:text-white">{user.name || "—"}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 dark:text-gray-400">Email</span>
            <span className="font-medium text-gray-900 dark:text-white">{user.email}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 dark:text-gray-400">Role</span>
            <Badge variant="outline" className="text-xs rounded-lg">{user.role}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Org Info */}
      {org && (
        <Card className="border-gray-100 dark:border-gray-800 shadow-sm animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-4 border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <CardTitle className="text-base font-semibold">Organization</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">Company</span>
              <span className="font-medium text-gray-900 dark:text-white">{org.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">Current Plan</span>
              <Badge className={`text-xs font-semibold rounded-lg border-0 ${
                tier === "ADVANCED" 
                  ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700" 
                  : tier === "PRO" 
                    ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700" 
                    : "bg-gray-100 text-gray-700"
              }`}>
                <Sparkles className="w-3 h-3 mr-1" />
                {tier === "FREE" ? "Free Trial" : tier}
              </Badge>
            </div>
            {trialEndsAt && tier === "FREE" && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Trial ends</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(trialEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
              </div>
            )}
            {stripeStatus && stripeStatus !== "trialing" && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Subscription</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  stripeStatus === "active" 
                    ? "bg-emerald-100 text-emerald-700" 
                    : stripeStatus === "past_due" 
                      ? "bg-rose-100 text-rose-700" 
                      : "bg-gray-100 text-gray-600"
                }`}>
                  {stripeStatus}
                </span>
              </div>
            )}
            {hasActiveSub && (
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePortal} 
                  disabled={portalLoading} 
                  className="w-full rounded-xl"
                >
                  {portalLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                  Manage Billing
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator className="dark:border-gray-800" />

      {/* Upgrade Plans */}
      {tier !== "ADVANCED" && (
        <div id="upgrade" className="space-y-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Upgrade Your Plan</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a plan to unlock more features. Cancel anytime.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLANS.filter((p) => tier === "FREE" || (tier === "PRO" && p.id === "ADVANCED")).map((plan) => (
              <div 
                key={plan.id} 
                className="group border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-4 hover:shadow-lg hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-900"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${plan.badge}`}>{plan.name}</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{plan.price}</span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      {f}
                    </li>
                  ))}
                  {plan.excluded.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 line-through">
                      <div className="w-5 h-5 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-400 text-xs">✗</span>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full bg-gradient-to-r ${plan.color} text-white border-none hover:opacity-90 rounded-xl shadow-md shadow-blue-200 dark:shadow-blue-900/30`}
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading === plan.id}
                >
                  {loading === plan.id ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirecting...</>
                  ) : (
                    <><Zap className="w-4 h-4 mr-2" />Upgrade to {plan.name}</>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tier === "ADVANCED" && (
        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">You&apos;re on the Advanced plan</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">Full access to all features including payroll and finance reports.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="dark:border-gray-800" />

      {/* Danger Zone - Reset Employees */}
      {isAdmin && (
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <h2 className="text-base font-semibold text-rose-700 dark:text-rose-400">Danger Zone</h2>
          </div>
          <Card className="border-rose-200 dark:border-rose-800">
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Reset All Employees</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  This will permanently delete all employee accounts and their related data
                  (time entries, schedules, payroll records, leave requests, etc.).
                  Admin accounts will be preserved.
                </p>
              </div>
              <ResetEmployeesButton />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
