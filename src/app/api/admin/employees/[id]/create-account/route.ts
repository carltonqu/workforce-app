import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg, getTenantDb } from "@/lib/tenant";
import { prisma as masterPrisma } from "@/lib/prisma";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

function getMasterDb() {
  return createClient({
    url: (process.env.DATABASE_URL ?? "").replace("libsql://", "https://"),
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
}

async function ensureMasterColumns(db: ReturnType<typeof getMasterDb>) {
  try { await db.execute("ALTER TABLE User ADD COLUMN username TEXT"); } catch {}
  try { await db.execute("ALTER TABLE User ADD COLUMN emailVerified INTEGER DEFAULT 1"); } catch {}
  try { await db.execute("ALTER TABLE User ADD COLUMN linkedEmployeeId TEXT"); } catch {}
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminUser = session.user as any;
  if (adminUser.role !== "MANAGER" && adminUser.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tenantDb = await getTenantDb(adminUser.orgId);

  // Fetch employee from tenant DB
  const empRes = await tenantDb.execute({ sql: "SELECT * FROM Employee WHERE id=?", args: [params.id] });
  if (!empRes.rows.length) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  const emp = empRes.rows[0] as any;

  const body = await req.json();
  const { username, password } = body;

  if (!username || username.trim().length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9._]+$/.test(username.trim())) {
    return NextResponse.json({ error: "Username can only contain letters, numbers, dots, and underscores" }, { status: 400 });
  }

  const cleanUsername = username.trim().toLowerCase();

  // Check if account already exists in tenant DB
  const existingLinked = await tenantDb.execute({ sql: "SELECT id FROM User WHERE linkedEmployeeId=?", args: [params.id] });
  if (existingLinked.rows.length) {
    return NextResponse.json({ error: "Account already exists for this employee" }, { status: 409 });
  }

  // Check username not taken in master DB (global uniqueness)
  const masterDb = getMasterDb();
  await ensureMasterColumns(masterDb);
  const existingUsername = await masterDb.execute({ sql: "SELECT id FROM User WHERE LOWER(username)=?", args: [cleanUsername] });
  if (existingUsername.rows.length) {
    return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
  }

  // Check email not taken in master DB
  const existingEmail = await masterPrisma.user.findUnique({ where: { email: emp.email as string } });
  if (existingEmail) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();
  const userId = crypto.randomUUID();

  // 1. Create user in MASTER DB (needed for auth.ts to find them at login)
  await masterPrisma.user.create({
    data: {
      id: userId,
      name: emp.fullName as string,
      email: emp.email as string,
      password: hashedPassword,
      role: "EMPLOYEE",
      tier: "FREE",
      orgId: adminUser.orgId || null,
    },
  });
  // Set username + linkedEmployeeId + emailVerified in master DB via raw SQL
  await masterDb.execute({
    sql: "UPDATE User SET username=?, linkedEmployeeId=?, emailVerified=1 WHERE id=?",
    args: [cleanUsername, params.id, userId],
  });

  // 2. Create user in TENANT DB (for app data queries)
  const tenantPrisma = await getPrismaForOrg(adminUser.orgId);
  try {
    await tenantPrisma.user.create({
      data: {
        id: userId,
        name: emp.fullName as string,
        email: emp.email as string,
        password: hashedPassword,
        role: "EMPLOYEE",
        tier: "FREE",
        orgId: adminUser.orgId || null,
      },
    });
    // Set username + linkedEmployeeId in tenant DB via raw SQL
    await tenantDb.execute({
      sql: "UPDATE User SET username=?, linkedEmployeeId=?, emailVerified=1 WHERE id=?",
      args: [cleanUsername, params.id, userId],
    });
  } catch (err) {
    console.error("[create-account] Failed to mirror user in tenant DB:", err);
    // Not fatal — auth will still work via master DB
  }

  // Update employee's orgId in tenant DB
  await tenantDb.execute({ sql: "UPDATE Employee SET orgId=? WHERE id=?", args: [adminUser.orgId || null, params.id] });

  return NextResponse.json({
    success: true,
    userId,
    username: cleanUsername,
    email: emp.email,
  });
}
