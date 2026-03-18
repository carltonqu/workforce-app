import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@libsql/client";

function getDb() {
  return createClient({
    url: (process.env.DATABASE_URL ?? "").replace("libsql://", "https://"),
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || new Date().toISOString().slice(0, 10);
  const to = searchParams.get("to") || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const rows = await db.execute({
    sql: "SELECT * FROM EmployeeShift WHERE userId=? AND date>=? AND date<=? ORDER BY date ASC",
    args: [user.id, from, to],
  });
  return NextResponse.json(rows.rows);
}
