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
  const rows = await db.execute({
    sql: "SELECT * FROM LeaveBalance WHERE userId=?",
    args: [user.id],
  });
  if (!rows.rows.length) {
    return NextResponse.json([
      { leaveType: "Vacation", totalDays: 15, usedDays: 0, remainingDays: 15 },
      { leaveType: "Sick", totalDays: 10, usedDays: 0, remainingDays: 10 },
      { leaveType: "Emergency", totalDays: 3, usedDays: 0, remainingDays: 3 },
    ]);
  }
  return NextResponse.json(rows.rows);
}
