import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTenantDb } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await getTenantDb(user.orgId);
  const rows = await db.execute("SELECT linkedEmployeeId FROM User WHERE linkedEmployeeId IS NOT NULL");
  const ids = rows.rows.map((r: any) => r.linkedEmployeeId as string);
  return NextResponse.json(ids);
}
