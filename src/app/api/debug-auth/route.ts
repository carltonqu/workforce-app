import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    let dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
    const authToken = process.env.DATABASE_AUTH_TOKEN;

    if (dbUrl.startsWith("libsql://")) {
      dbUrl = dbUrl.replace("libsql://", "https://");
    }

    const { PrismaLibSql } = await import("@prisma/adapter-libsql");
    const { PrismaClient } = await import("@prisma/client");
    const adapter = new PrismaLibSql({ url: dbUrl, authToken });
    const prisma = new PrismaClient({ adapter } as any);

    const user = await prisma.user.findUnique({
      where: { email: "admin@demo.com" },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found", converted_url: dbUrl.substring(0, 40) });
    }

    const match = await bcrypt.compare("password123", user.password);

    return NextResponse.json({
      found: true,
      email: user.email,
      passwordMatch: match,
      converted_url: dbUrl.substring(0, 40),
      has_token: !!authToken,
    });
  } catch (e: any) {
    return NextResponse.json({
      error: e.message,
      stack: e.stack?.split("\n").slice(0, 3).join(" | "),
    }, { status: 500 });
  }
}
