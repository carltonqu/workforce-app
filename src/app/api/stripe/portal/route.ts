import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    const org = await prisma.organization.findUnique({ where: { id: user.orgId } });
    if (!org?.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

    const appUrl = process.env.NEXTAUTH_URL ?? "https://clockroster.com";

    const body = new URLSearchParams({
      customer: org.stripeCustomerId,
      return_url: `${appUrl}/settings`,
    }).toString();

    const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": "2024-06-20",
      },
      body,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? "Stripe portal error");

    return NextResponse.json({ url: data.url });
  } catch (err: any) {
    console.error("[stripe/portal]", err);
    return NextResponse.json({ error: err?.message || "Portal failed" }, { status: 500 });
  }
}
