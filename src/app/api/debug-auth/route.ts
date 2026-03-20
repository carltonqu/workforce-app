import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Debug route — uses master DB intentionally (demo accounts live there)
export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "admin@demo.com" },
    });

    if (!user) return NextResponse.json({ error: "User not found" });

    const match = await bcrypt.compare("password123", user.password);
    return NextResponse.json({ found: true, email: user.email, passwordMatch: match });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
