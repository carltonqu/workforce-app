"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck, Check, Zap, Shield, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Plan = "free" | "pro" | "advance";
type Step = "plan" | "register" | "verify";

const PLANS = [
  {
    id: "free" as Plan,
    name: "Free Trial",
    price: "Free",
    period: "14-day trial",
    icon: Gift,
    color: "border-gray-200 hover:border-gray-400",
    selectedColor: "border-blue-500 bg-blue-50",
    badgeColor: "bg-gray-100 text-gray-700",
    features: ["Employee management", "Attendance monitoring", "Performance tracking"],
    excluded: ["Announcements", "Approvals", "Payroll", "Finance reports"],
  },
  {
    id: "pro" as Plan,
    name: "Pro",
    price: "$29",
    period: "/month",
    icon: Zap,
    color: "border-gray-200 hover:border-blue-400",
    selectedColor: "border-blue-500 bg-blue-50",
    badgeColor: "bg-blue-100 text-blue-700",
    features: ["Everything in Free", "Announcements", "Approvals & leave", "Scheduling", "Assets"],
    excluded: ["Payroll", "Finance reports"],
  },
  {
    id: "advance" as Plan,
    name: "Advanced",
    price: "$59",
    period: "/month",
    icon: Shield,
    color: "border-gray-200 hover:border-purple-400",
    selectedColor: "border-purple-500 bg-purple-50",
    badgeColor: "bg-purple-100 text-purple-700",
    popular: true,
    features: ["Everything in Pro", "Payroll processing", "Finance reports", "Full access"],
    excluded: [],
  },
];

const inputCls = "w-full border border-gray-300 rounded-lg bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function SignupPage() {
  const [step, setStep] = useState<Step>("plan");
  const [selectedPlan, setSelectedPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", companyName: "" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, selectedPlan }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to register"); return; }
      setStep("verify");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Verification failed"); return; }

      if (data.requiresPayment && data.checkoutUrl) {
        // Paid plan — redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        // Free plan — go to login
        window.location.href = "/login?registered=1";
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <span className="font-bold text-2xl text-gray-900">WorkForce</span>
          </Link>
        </div>

        {/* Step 1: Plan Selection */}
        {step === "plan" && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Choose your plan</h1>
              <p className="text-gray-500 mt-1 text-sm">Start with a free trial or unlock full features immediately</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPlan === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                      isSelected ? p.selectedColor : p.color
                    }`}
                  >
                    {p.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.badgeColor}`}>{p.name}</span>
                    </div>

                    <div className="mb-4">
                      <span className="text-2xl font-bold text-gray-900">{p.price}</span>
                      {p.period && <span className="text-xs text-gray-400 ml-1">{p.period}</span>}
                    </div>

                    <ul className="space-y-1.5">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-700">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                      {p.excluded.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-gray-400 line-through">
                          <span className="w-3.5 h-3.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                onClick={() => setStep("register")}
              >
                Continue with {plan.name} →
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
            </p>
          </div>
        )}

        {/* Step 2: Register */}
        {step === "register" && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create your account</CardTitle>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${plan.badgeColor}`}>
                  {plan.name} — {plan.price}{plan.period ?? ""}
                </span>
              </div>
              <CardDescription>Set up your WorkForce admin workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={handleRegister}>
                <input className={inputCls} placeholder="Full name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
                <input className={inputCls} placeholder="Work email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
                <input className={inputCls} placeholder="Company / Organization name" value={form.companyName} onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))} required />
                <input className={inputCls} placeholder="Password (min 8 chars)" type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} minLength={8} required />

                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending code...</> : "Send Verification Code"}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => { setStep("plan"); setError(""); }}>
                  ← Change Plan
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Verify Email */}
        {step === "verify" && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Verify your email</CardTitle>
              <CardDescription>
                Enter the 6-digit code sent to <strong>{form.email}</strong>
                {selectedPlan !== "free" && (
                  <span className="block mt-1 text-blue-600 font-medium">
                    After verification you&apos;ll be redirected to complete payment for the {plan.name} plan.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={handleVerify}>
                <div className="relative">
                  <MailCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className={inputCls + " pl-9 text-center text-lg tracking-widest font-mono"}
                    placeholder="000000"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {selectedPlan !== "free" ? "Verifying & preparing payment..." : "Verifying..."}</>
                  ) : (
                    selectedPlan !== "free" ? "Verify & Go to Payment →" : "Verify & Activate Account"
                  )}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => { setStep("register"); setError(""); }}>
                  ← Back
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
