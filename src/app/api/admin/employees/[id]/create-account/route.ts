import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg, getTenantDb } from "@/lib/tenant";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminUser = session.user as any;
  if (adminUser.role !== "MANAGER" && adminUser.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const prisma = await getPrismaForOrg(adminUser.orgId);
  const db = await getTenantDb(adminUser.orgId);

  const empRes = await db.execute({ sql: "SELECT * FROM Employee WHERE id=?", args: [params.id] });
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

  // Validate username: only letters, numbers, dots, underscores
  if (!/^[a-zA-Z0-9._]+$/.test(username.trim())) {
    return NextResponse.json({ error: "Username can only contain letters, numbers, dots, and underscores" }, { status: 400 });
  }

  // Check if account already exists for this employee
  const existingByLinked = await db.execute({ sql: "SELECT id FROM User WHERE linkedEmployeeId=?", args: [params.id] });
  if (existingByLinked.rows.length) {
    return NextResponse.json({ error: "Account already exists for this employee" }, { status: 409 });
  }

  // Check username not taken
  const existingByUsername = await db.execute({ sql: "SELECT id FROM User WHERE username=?", args: [username.trim().toLowerCase()] });
  if (existingByUsername.rows.length) {
    return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
  }

  // Check email not taken
  const existingByEmail = await prisma.user.findUnique({ where: { email: emp.email as string } });
  if (existingByEmail) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name: emp.fullName as string,
      email: emp.email as string,
      password: hashedPassword,
      role: "EMPLOYEE",
      tier: "FREE",
      orgId: adminUser.orgId || null,
    },
  });

  // Store username and link employee profile
  await db.execute({
    sql: "UPDATE User SET linkedEmployeeId=?, username=? WHERE id=?",
    args: [params.id, username.trim().toLowerCase(), newUser.id],
  });
  await db.execute({ sql: "UPDATE Employee SET orgId=? WHERE id=?", args: [adminUser.orgId || null, params.id] });

  return NextResponse.json({
    success: true,
    userId: newUser.id,
    username: username.trim().toLowerCase(),
    email: emp.email,
  });
}
