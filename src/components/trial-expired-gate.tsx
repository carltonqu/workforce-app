"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Lock, Zap, Check, Loader2, X } from "lucide-react";
import { isTrialExpired } from "@/lib/tier";

const PLANS = [
  {
    id: "PRO" as const,
    name: "Pro",
    price: "$29",
    period: "/month",
    color: "from-blue-500 to-blue-700",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    ring: "ring-blue-500",
    features: [
      "Employee management",
      "Attendance & performance",
      "Announcements",
      "Approvals & leave requests",
      "Asset management",
      "Scheduling",
    ],
  },
  {
    id: "ADVANCED" as const,
    name: "Advanced",
    price: "$59",
    period: "/month",
    color: "from-purple-500 to-purple-700",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    ring: "ring-purple-500",
    popular: true,
    features: [
      "Everything in Pro",
      "Automated Payroll",
      "Finance reports",
      "Full system access",
      "Priority support",
    ],
  },
];

export function TrialExpiredGate({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user as any;

  const tier = user?.tier ?? "FREE";
  const role = user?.role ?? "EMPLOYEE";
  const trialEndsAt = user?.trialEndsAt ?? null;
  const stripeStatus = user?.stripeStatus ?? null;

  // Only admins (MANAGER/HR) are subject to billing gates
  // Employees and supervisors always have access (they don't manage billing)
  const isAdmin = role === "MANAGER" || role === "HR";
  const expired = isAdmin && isTrialExpired(tier, trialEndsAt, stripeStatus);

  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleUpgrade(plan: "PRO" | "ADVANCED") {
    setLoading(plan);
    setError("");
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
        setError(data.error || "Failed to start checkout. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  if (!expired) return <>{children}</>;

  return (
    <>
      {/* Blurred background */}
      <div className="pointer-events-none select-none blur-sm opacity-30 fixed inset-0 z-40">
        {children}
      </div>

      {/* Full-screen blocking modal — no close button, no backdrop click */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="text-center px-8 pt-8 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Your free trial has ended</h2>
            <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
              Your 14-day trial is over. Choose a plan below to continue using WorkForce.
              You won&apos;t lose any of your data.
            </p>
          </div>

          {/* Plans */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative border-2 rounded-2xl p-5 flex flex-col gap-4 ${plan.popular ? "border-purple-400" : "border-gray-200"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${plan.badge}`}>
                    {plan.name}
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-xs text-gray-400">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={!!loading}
                  className={`w-full py-2.5 rounded-xl text-white font-semibold text-sm bg-gradient-to-r ${plan.color} hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2`}
                >
                  {loading === plan.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to payment...</>
                  ) : (
                    <><Zap className="w-4 h-4" /> Upgrade to {plan.name}</>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <X className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Footer note */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-gray-400">
              Secure checkout powered by Stripe · Cancel anytime · Your data is safe
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
