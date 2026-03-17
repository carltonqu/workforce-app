import Link from "next/link";
import {
  Clock,
  Calendar,
  DollarSign,
  BarChart2,
  Bell,
  Shield,
  Check,
  ArrowRight,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Clock,
    title: "Smart Time Tracking",
    description:
      "Clock in/out with overtime detection. Real-time display shows hours worked and alerts on overtime.",
    tier: "Free",
  },
  {
    icon: Calendar,
    title: "Drag & Drop Scheduling",
    description:
      "Build weekly schedules visually. Drag shifts between employees and days with ease.",
    tier: "Pro",
  },
  {
    icon: DollarSign,
    title: "Automated Payroll",
    description:
      "Hours automatically sync to payroll. Supports custom pay rates, overtime multipliers, and deductions.",
    tier: "Advanced",
  },
  {
    icon: BarChart2,
    title: "Analytics & Reports",
    description:
      "Labor cost charts, attendance trends, and custom reports for data-driven decisions.",
    tier: "Advanced",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "In-app notification center for shift approvals, schedule changes, and payroll alerts.",
    tier: "Pro",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description:
      "Manager, HR, and Employee roles with fine-grained permission gates for every action.",
    tier: "Free",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for small teams just getting started.",
    features: [
      "Time Tracking",
      "Clock In/Out",
      "Overtime Detection",
      "Role-Based Access",
      "Up to 5 employees",
    ],
    cta: "Get Started Free",
    highlight: false,
    color: "border-gray-200 dark:border-gray-700",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For growing teams that need scheduling and communication.",
    features: [
      "Everything in Free",
      "Drag & Drop Scheduling",
      "Smart Notifications",
      "Shift Approvals",
      "Up to 50 employees",
    ],
    cta: "Start Pro Trial",
    highlight: true,
    color: "border-blue-500 dark:border-blue-400",
  },
  {
    name: "Advanced",
    price: "$79",
    period: "/month",
    description: "Full-featured workforce management for enterprises.",
    features: [
      "Everything in Pro",
      "Automated Payroll",
      "Analytics & Reports",
      "Labor Cost Charts",
      "Unlimited employees",
    ],
    cta: "Start Advanced Trial",
    highlight: false,
    color: "border-purple-200 dark:border-purple-700",
  },
];

const tierColors: Record<string, string> = {
  Free: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Pro: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Advanced:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">
              WorkForce
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/login">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <Badge className="mb-4 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800">
          <Zap className="w-3 h-3 mr-1" />
          All-in-one workforce platform
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          Manage your workforce{" "}
          <span className="text-blue-600 dark:text-blue-400">smarter</span>
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          Time tracking, drag-and-drop scheduling, automated payroll, and
          real-time analytics — everything your team needs in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              Start for free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="px-8">
              <Users className="w-4 h-4 mr-2" />
              View demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Everything you need
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Six powerful features designed to streamline workforce operations
            from clock-in to paycheck.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${tierColors[feature.tier]}`}
                  >
                    {feature.tier}
                  </Badge>
                </div>
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="pricing">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Start free, upgrade when you need more.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 p-8 ${plan.color} bg-white dark:bg-gray-900 ${
                plan.highlight ? "shadow-lg shadow-blue-100 dark:shadow-blue-900" : ""
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {plan.description}
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/login">
                <Button
                  className={`w-full ${
                    plan.highlight
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : ""
                  }`}
                  variant={plan.highlight ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            © {new Date().getFullYear()} WorkForce. Built with Next.js 14,
            Prisma, and Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}
