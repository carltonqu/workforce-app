import Link from "next/link";
import { Check, X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  {
    name: "Free Trial",
    price: "$0",
    period: "14 days",
    description: "Try core workforce tools with no credit card required.",
    cta: "Get Started",
    popular: false,
    style: "border-gray-200",
    features: {
      attendance: true,
      employees: true,
      scheduling: false,
      announcements: false,
      approvals: false,
      assets: false,
      notifications: false,
      payroll: false,
      reports: false,
    },
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "Best for growing teams that need operational control.",
    cta: "Get Started",
    popular: false,
    style: "border-blue-300",
    features: {
      attendance: true,
      employees: true,
      scheduling: true,
      announcements: true,
      approvals: true,
      assets: true,
      notifications: true,
      payroll: false,
      reports: false,
    },
  },
  {
    name: "Advanced",
    price: "$59",
    period: "/mo",
    description: "For teams that want payroll, finance, and full analytics.",
    cta: "Get Started",
    popular: true,
    style: "border-purple-500 shadow-xl shadow-purple-100",
    features: {
      attendance: true,
      employees: true,
      scheduling: true,
      announcements: true,
      approvals: true,
      assets: true,
      notifications: true,
      payroll: true,
      reports: true,
    },
  },
] as const;

const featureRows = [
  ["Employee Management", "employees"],
  ["Attendance & Time Tracking", "attendance"],
  ["Shift Scheduling", "scheduling"],
  ["Announcements", "announcements"],
  ["Approvals & Leave", "approvals"],
  ["Asset Management", "assets"],
  ["Notifications", "notifications"],
  ["Payroll", "payroll"],
  ["Reports & Finance", "reports"],
] as const;

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Simple pricing, scale when you’re ready
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">Choose the right plan for your team</h1>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Start with a free trial, then unlock advanced features as your operations grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.style} bg-white/95`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white border-purple-600">Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-5">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 ml-1">{plan.period}</span>
                </div>
                <Link href="/signup">
                  <Button className={`w-full ${plan.popular ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}`} variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle>Feature comparison</CardTitle>
            <CardDescription>See exactly what’s included in each plan.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 font-semibold">Feature</th>
                    <th className="text-center py-3 font-semibold">Free Trial</th>
                    <th className="text-center py-3 font-semibold">Pro</th>
                    <th className="text-center py-3 font-semibold">Advanced</th>
                  </tr>
                </thead>
                <tbody>
                  {featureRows.map(([label, key]) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="py-3 text-gray-700">{label}</td>
                      {plans.map((plan) => (
                        <td key={`${plan.name}-${key}`} className="py-3 text-center">
                          {plan.features[key] ? (
                            <Check className="w-4 h-4 text-emerald-600 inline-block" />
                          ) : (
                            <X className="w-4 h-4 text-rose-500 inline-block" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <section className="mt-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Yes. You can cancel your subscription anytime from your billing portal with no hidden fees.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Do I need a credit card for trial?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                No credit card is required to start the free trial.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What happens after trial expires?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Your data stays safe. Upgrade to Pro or Advanced to continue full access.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Can I change plans later?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Absolutely. You can upgrade or downgrade at any time.
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="text-center mt-12 space-y-3">
          <Link href="/signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">Get Started</Button>
          </Link>
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
