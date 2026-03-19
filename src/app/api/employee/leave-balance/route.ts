import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@libsql/client";

function getDb() {
  return createClient({
    url: (process.env.DATABASE_URL ?? "").replace("libsql://", "https://"),
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
}

const DEFAULT_LEAVE_TYPES = [
  { leaveType: "Vacation", totalDays: 15 },
  { leaveType: "Sick", totalDays: 10 },
  { leaveType: "Emergency", totalDays: 3 },
  { leaveType: "Maternity", totalDays: 105 },
  { leaveType: "Paternity", totalDays: 7 },
  { leaveType: "Bereavement", totalDays: 3 },
];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const db = getDb();
  const year = new Date().getFullYear();

  const rows = await db.execute({
    sql: "SELECT * FROM LeaveBalance WHERE userId=? AND year=?",
    args: [user.id, year],
  });

  // If no rows exist yet, seed them with defaults and return
  if (!rows.rows.length) {
    const now = new Date().toISOString();
    const seeded = [];
    for (const lt of DEFAULT_LEAVE_TYPES) {
      const id = crypto.randomUUID();
      await db.execute({
        sql: `INSERT INTO LeaveBalance (id, userId, leaveType, totalDays, usedDays, remainingDays, year, orgId, updatedAt) VALUES (?,?,?,?,?,?,?,?,?)`,
        args: [id, user.id, lt.leaveType, lt.totalDays, 0, lt.totalDays, year, user.orgId ?? null, now],
      });
      seeded.push({ id, userId: user.id, leaveType: lt.leaveType, totalDays: lt.totalDays, usedDays: 0, remainingDays: lt.totalDays, year });
    }
    return NextResponse.json(seeded);
  }

  return NextResponse.json(rows.rows);
}
