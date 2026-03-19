import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { prisma } from "@/lib/prisma";

function getDb() {
  return createClient({
    url: (process.env.DATABASE_URL ?? "").replace("libsql://", "https://"),
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
}

async function ensureTables(db: ReturnType<typeof getDb>) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS EmailVerification (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      companyName TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      code TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);
  try { await db.execute("ALTER TABLE User ADD COLUMN emailVerified INTEGER DEFAULT 1"); } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const code = String(body?.code || "").trim();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required" }, { status: 400 });
    }

    const db = getDb();
    await ensureTables(db);

    const row = await db.execute({
      sql: "SELECT * FROM EmailVerification WHERE LOWER(email)=? LIMIT 1",
      args: [email],
    });

    const pending = row.rows[0];
    if (!pending) {
      return NextResponse.json({ error: "No pending verification found for this email" }, { status: 404 });
    }

    if ((pending.code as string) !== code) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    if (new Date(pending.expiresAt as string).getTime() < Date.now()) {
      return NextResponse.json({ error: "Verification code expired. Please request a new one." }, { status: 400 });
    }

    // Double-check user doesn't already exist
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await db.execute({ sql: "DELETE FROM EmailVerification WHERE email=?", args: [email] });
      return NextResponse.json({ error: "Email already verified. Please login." }, { status: 409 });
    }

    // Create tenant org for this admin
    const org = await prisma.organization.create({
      data: {
        name: String(pending.companyName),
        tier: "ADVANCED",
      },
    });

    // Create admin user
    const user = await prisma.user.create({
      data: {
        name: String(pending.name),
        email,
        password: String(pending.passwordHash),
        role: "MANAGER",
        tier: "ADVANCED",
        orgId: org.id,
      },
    });

    // Mark verified at DB level
    await db.execute({
      sql: "UPDATE User SET emailVerified=1 WHERE id=?",
      args: [user.id],
    });

    // Remove pending row
    await db.execute({
      sql: "DELETE FROM EmailVerification WHERE email=?",
      args: [email],
    });

    return NextResponse.json({ success: true, message: "Email verified. You can now login.", email });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Verification failed" }, { status: 500 });
  }
}
