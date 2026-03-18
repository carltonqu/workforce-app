import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@libsql/client";

function getDb() {
  return createClient({
    url: (process.env.DATABASE_URL ?? "").replace("libsql://", "https://"),
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = getDb();
  const body = await req.json();
  const now = new Date().toISOString();
  const { status, adminComment, isLeave } = body;
  if (isLeave) {
    await db.execute({
      sql: `UPDATE LeaveRequest SET status=?, adminComment=?, updatedAt=? WHERE id=?`,
      args: [status, adminComment || null, now, params.id],
    });
  } else {
    await db.execute({
      sql: `UPDATE ApprovalRequest SET status=?, adminComment=?, updatedAt=? WHERE id=?`,
      args: [status, adminComment || null, now, params.id],
    });
  }
  return NextResponse.json({ success: true });
}
