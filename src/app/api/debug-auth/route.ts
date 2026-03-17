import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "admin@demo.com" },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found", db_url: process.env.DATABASE_URL?.substring(0, 30) });
    }

    const match = await bcrypt.compare("password123", user.password);

    return NextResponse.json({
      found: true,
      email: user.email,
      passwordMatch: match,
      tier: user.tier,
      role: user.role,
      db_url_prefix: process.env.DATABASE_URL?.substring(0, 30),
      has_token: !!process.env.DATABASE_AUTH_TOKEN,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, db_url: process.env.DATABASE_URL?.substring(0, 30) }, { status: 500 });
  }
}
