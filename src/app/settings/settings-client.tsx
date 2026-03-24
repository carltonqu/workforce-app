"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Crown, User, Building2, Shield, Zap, Check, AlertTriangle, Loader2, ExternalLink, Clock
} from "lucide-react";
import { trialDaysLeft, isTrialExpired } from "@/lib/tier";

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
    color: "from-blue-500 to-blue-700",
    badge: "bg-blue-100 text-blue-700",
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
    color: "from-purple-500 to-purple-700",
    badge: "bg-purple-100 text-purple-700",
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
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout");
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
    <div className="space-y-6 max-w-2xl">

      {/* Trial expired banner */}
      {expired && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Your free trial has expired</p>
            <p className="text-xs text-red-600 mt-0.5">
              Upgrade to Pro or Advanced to continue using the app.
            </p>
          </div>
        </div>
      )}

      {/* Trial active banner */}
      {!expired && tier === "FREE" && daysLeft > 0 && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800">
              Free trial — {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
            </p>
            <p className="text-xs text-blue-500 mt-0.5">Upgrade before your trial ends to keep full access.</p>
          </div>
        </div>
      )}

      {/* User Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="w-4 h-4" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Name</span>
            <span className="font-medium text-gray-900">{user.name || "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-900">{user.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Role</span>
            <Badge variant="outline" className="text-xs">{user.role}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Org Info */}
      {org && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Company</span>
              <span className="font-medium text-gray-900">{org.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Current Plan</span>
              <Badge className={`text-xs font-semibold ${tier === "ADVANCED" ? "bg-purple-100 text-purple-700" : tier === "PRO" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                {tier === "FREE" ? "Free Trial" : tier}
              </Badge>
            </div>
            {trialEndsAt && tier === "FREE" && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Trial ends</span>
                <span className="font-medium text-gray-900">
                  {new Date(trialEndsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
              </div>
            )}
            {stripeStatus && stripeStatus !== "trialing" && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subscription</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stripeStatus === "active" ? "bg-green-100 text-green-700" : stripeStatus === "past_due" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                  {stripeStatus}
                </span>
              </div>
            )}
            {hasActiveSub && (
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={handlePortal} disabled={portalLoading} className="w-full">
                  {portalLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                  Manage Billing
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Upgrade Plans */}
      {tier !== "ADVANCED" && (
        <div id="upgrade" className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <h2 className="text-base font-semibold text-gray-900">Upgrade Your Plan</h2>
          </div>
          <p className="text-sm text-gray-500">
            Choose a plan to unlock more features. Cancel anytime.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLANS.filter((p) => tier === "FREE" || (tier === "PRO" && p.id === "ADVANCED")).map((plan) => (
              <div key={plan.id} className="border border-gray-200 rounded-2xl p-5 space-y-4 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${plan.badge}`}>{plan.name}</span>
                  <span className="text-lg font-bold text-gray-900">{plan.price}</span>
                </div>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                  {plan.excluded.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-400 line-through">
                      <span className="w-4 h-4 flex-shrink-0 text-center text-gray-300">✗</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full bg-gradient-to-r ${plan.color} text-white border-none hover:opacity-90`}
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
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-5 flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-purple-800">You&apos;re on the Advanced plan</p>
              <p className="text-xs text-purple-600 mt-0.5">Full access to all features including payroll and finance reports.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
