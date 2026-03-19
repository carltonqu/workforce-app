import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";

function getDb() {
  return createClient({
    url: (process.env.DATABASE_URL ?? "").replace("libsql://", "https://"),
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const db = getDb();
  const { announcementId, emoji } = await req.json();
  if (!announcementId || !emoji) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Toggle: if exists, remove; if not, add
  const existing = await db.execute({
    sql: `SELECT id FROM AnnouncementReaction WHERE announcementId=? AND userId=? AND emoji=?`,
    args: [announcementId, userId, emoji],
  });

  if (existing.rows.length > 0) {
    await db.execute({
      sql: `DELETE FROM AnnouncementReaction WHERE announcementId=? AND userId=? AND emoji=?`,
      args: [announcementId, userId, emoji],
    });
    return NextResponse.json({ action: "removed" });
  } else {
    const id = randomUUID();
    const now = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO AnnouncementReaction (id, announcementId, userId, emoji, createdAt) VALUES (?,?,?,?,?)`,
      args: [id, announcementId, userId, emoji, now],
    });
    return NextResponse.json({ action: "added" });
  }
}
