"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { signIn } from "next-auth/react";
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
              <div className="space-y-4">
                {/* Google Sign Up */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center gap-3 py-2.5"
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs text-gray-400 whitespace-nowrap">or register with email</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                <form className="space-y-3" onSubmit={handleRegister}>
                  <input className={inputCls} placeholder="Full name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
                  <input className={inputCls} placeholder="Work email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
                  <input className={inputCls} placeholder="Company / Organization name" value={form.companyName} onChange={(e) => setForm(f => ({ ...f, companyName: e.target.value }))} required />
                  <input className={inputCls} placeholder="Password (min 8 chars)" type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} minLength={8} required />
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending verification...</> : "Create & Send Verification"}
                  </Button>
                </form>
              </div>
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
