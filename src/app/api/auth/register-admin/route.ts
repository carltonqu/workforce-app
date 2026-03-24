import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

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
  try { await db.execute("ALTER TABLE User ADD COLUMN username TEXT"); } catch {}
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendVerificationEmail(email: string, code: string, companyName: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Email service not configured. Please set RESEND_API_KEY and RESEND_FROM_EMAIL.");
  }

  const html = `
    <div style="font-family:Arial,sans-serif;padding:24px">
      <h2 style="margin:0 0 12px 0">Verify your admin account</h2>
      <p style="margin:0 0 12px 0">You're creating an admin workspace for <strong>${companyName}</strong>.</p>
      <p style="margin:0 0 8px 0">Your verification code is:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f3f4f6;padding:12px 16px;display:inline-block;border-radius:8px">${code}</div>
      <p style="margin:14px 0 0 0;color:#6b7280">Code expires in 15 minutes.</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "WorkForce Admin Email Verification",
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to send verification email: ${text}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const companyName = String(body?.companyName || "").trim();
    const selectedPlan = String(body?.selectedPlan || "free").toLowerCase(); // free | pro | advance

    if (!name || !email || !password || !companyName) {
      return NextResponse.json({ error: "Name, email, password, and company name are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const db = getDb();
    await ensureTables(db);

    // Check existing user
    const existingUser = await db.execute({
      sql: "SELECT id FROM User WHERE LOWER(email)=? LIMIT 1",
      args: [email],
    });
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "Email already registered. Please login instead." }, { status: 409 });
    }

    const code = generateCode();
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
    const id = crypto.randomUUID();

    // Ensure selectedPlan column exists
    try { await db.execute("ALTER TABLE EmailVerification ADD COLUMN selectedPlan TEXT DEFAULT 'free'"); } catch {}

    // Upsert pending verification row
    await db.execute({
      sql: `INSERT INTO EmailVerification (id,email,name,companyName,passwordHash,code,expiresAt,createdAt,selectedPlan)
            VALUES (?,?,?,?,?,?,?,?,?)
            ON CONFLICT(email) DO UPDATE SET
              name=excluded.name,
              companyName=excluded.companyName,
              passwordHash=excluded.passwordHash,
              code=excluded.code,
              expiresAt=excluded.expiresAt,
              createdAt=excluded.createdAt,
              selectedPlan=excluded.selectedPlan`,
      args: [id, email, name, companyName, passwordHash, code, expiresAt, now.toISOString(), selectedPlan],
    });

    await sendVerificationEmail(email, code, companyName);

    return NextResponse.json({ success: true, message: "Verification code sent to your email.", selectedPlan });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to register" }, { status: 500 });
  }
}
