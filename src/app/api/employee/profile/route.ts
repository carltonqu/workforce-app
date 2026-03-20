import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTenantDb } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const db = await getTenantDb(user.orgId);
  // Ensure motto column exists
  try {
    await db.execute(`ALTER TABLE Employee ADD COLUMN motto TEXT`);
  } catch { /* column already exists */ }
  const userRow = await db.execute({ sql: "SELECT linkedEmployeeId FROM User WHERE id=?", args: [user.id] });
  const linkedId = userRow.rows[0]?.linkedEmployeeId as string | null;
  if (!linkedId) {
    return NextResponse.json({ id: null, fullName: user.name, email: user.email, employeeId: null, noProfile: true });
  }
  const empRes = await db.execute({ sql: "SELECT * FROM Employee WHERE id=?", args: [linkedId] });
  if (!empRes.rows.length) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json(empRes.rows[0]);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const db = await getTenantDb(user.orgId);
  const userRow = await db.execute({ sql: "SELECT linkedEmployeeId FROM User WHERE id=?", args: [user.id] });
  const linkedId = userRow.rows[0]?.linkedEmployeeId as string | null;
  if (!linkedId) return NextResponse.json({ error: "No employee profile linked" }, { status: 404 });
  const body = await req.json();
  const now = new Date().toISOString();
  const allowed = ["phoneNumber", "address", "emergencyContact", "profilePhoto", "motto"];
  const updates: string[] = [];
  const args: any[] = [];
  for (const field of allowed) {
    if (body[field] !== undefined) {
      updates.push(`${field}=?`);
      args.push(typeof body[field] === "object" ? JSON.stringify(body[field]) : body[field]);
    }
  }
  if (!updates.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  updates.push("updatedAt=?");
  args.push(now, linkedId);
  await db.execute({ sql: `UPDATE Employee SET ${updates.join(",")} WHERE id=?`, args });
  return NextResponse.json({ success: true });
}
