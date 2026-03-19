"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function SignupPage() {
  const [step, setStep] = useState<"register" | "verify">("register");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", companyName: "" });
  const [code, setCode] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to register");
        return;
      }
      toast.success("Verification code sent to your email");
      setStep("verify");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Verification failed");
        return;
      }
      toast.success("Account verified. Please login.");
      window.location.href = "/login";
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 px-3 py-2.5 text-sm";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <span className="font-bold text-2xl text-gray-900 dark:text-white">WorkForce</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{step === "register" ? "Create Admin Account" : "Verify Email"}</CardTitle>
            <CardDescription>
              {step === "register"
                ? "Create your own admin workspace for your employees"
                : `Enter the verification code sent to ${form.email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "register" ? (
              <form className="space-y-3" onSubmit={handleRegister}>
                <input className={inputCls} placeholder="Full name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
                <input className={inputCls} placeholder="Work email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
                <input className={inputCls} placeholder="Company / Organization name" value={form.companyName} onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))} required />
                <input className={inputCls} placeholder="Password (min 8 chars)" type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} minLength={8} required />
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending verification...</> : "Create & Send Verification"}
                </Button>
              </form>
            ) : (
              <form className="space-y-3" onSubmit={handleVerify}>
                <div className="relative">
                  <MailCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className={inputCls + " pl-9"} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify & Activate Admin Account"}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => setStep("register")}>Back</Button>
              </form>
            )}

            <p className="text-xs text-center text-gray-500 mt-4">
              Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
