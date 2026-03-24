import { NextResponse } from "next/server";

const PLANS = [
  {
    code: "free",
    name: "Free Trial",
    price: 0,
    priceLabel: "Free",
    period: null,
    description: "14-day trial with basic features",
    features: [
      "Employee creation & management",
      "Attendance monitoring",
      "Performance tracking",
      "Clock in/out",
    ],
    excluded: [
      "Announcements",
      "Approvals & leave requests",
      "Scheduling",
      "Assets",
      "Payroll",
      "Finance reports",
    ],
    tier: "FREE",
    priceId: null,
  },
  {
    code: "pro",
    name: "Pro",
    price: 29,
    priceLabel: "$29",
    period: "/month",
    description: "Core workforce features for growing teams",
    features: [
      "Everything in Free",
      "Announcements",
      "Approval workflows & leave requests",
      "Scheduling",
      "Asset management",
      "Smart notifications",
      "Supervisor assignments",
    ],
    excluded: [
      "Payroll processing",
      "Finance reports",
    ],
    tier: "PRO",
    priceId: process.env.STRIPE_PRICE_PRO ?? null,
    popular: false,
  },
  {
    code: "advance",
    name: "Advanced",
    price: 59,
    priceLabel: "$59",
    period: "/month",
    description: "Full access — payroll, finance, everything",
    features: [
      "Everything in Pro",
      "Automated Payroll",
      "Finance reports & summaries",
      "Full system access",
      "Priority support",
    ],
    excluded: [],
    tier: "ADVANCED",
    priceId: process.env.STRIPE_PRICE_ADVANCED ?? null,
    popular: true,
  },
];

export async function GET() {
  // Don't expose priceIds to frontend — they're internal
  const safe = PLANS.map(({ priceId: _p, ...rest }) => rest);
  return NextResponse.json(safe);
}
