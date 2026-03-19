import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@libsql/client";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

function getDb() {
  return createClient({
    url: (process.env.DATABASE_URL ?? "").replace("libsql://", "https://"),
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
}

async function ensureTables(db: ReturnType<typeof getDb>) {
  await db.execute(`CREATE TABLE IF NOT EXISTS Announcement (id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, type TEXT DEFAULT 'general', createdBy TEXT NOT NULL, createdByName TEXT, orgId TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS AnnouncementReaction (id TEXT PRIMARY KEY, announcementId TEXT NOT NULL, userId TEXT NOT NULL, emoji TEXT NOT NULL, createdAt TEXT NOT NULL, UNIQUE(announcementId, userId, emoji))`);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  await ensureTables(db);

  const userId = (session.user as any).id;
  const announcements = await db.execute(`SELECT * FROM Announcement ORDER BY createdAt DESC LIMIT 50`);
  const reactions = await db.execute(`SELECT * FROM AnnouncementReaction`);

  // Group reactions by announcementId
  const reactionMap: Record<string, { emoji: string; count: number; userReacted: boolean }[]> = {};
  for (const r of reactions.rows) {
    const aid = r.announcementId as string;
    if (!reactionMap[aid]) reactionMap[aid] = [];
    const existing = reactionMap[aid].find(x => x.emoji === r.emoji);
    if (existing) {
      existing.count++;
      if (r.userId === userId) existing.userReacted = true;
    } else {
      reactionMap[aid].push({ emoji: r.emoji as string, count: 1, userReacted: r.userId === userId });
    }
  }

  return NextResponse.json(announcements.rows.map(a => ({
    ...a,
    reactions: reactionMap[a.id as string] || [],
  })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getDb();
  await ensureTables(db);
  const body = await req.json();
  const { title, body: announcementBody, type } = body;
  if (!title || !announcementBody) return NextResponse.json({ error: "Title and body required" }, { status: 400 });

  const id = randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO Announcement (id, title, body, type, createdBy, createdByName, orgId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?)`,
    args: [id, title, announcementBody, type || "general", user.id, user.name || "Admin", user.orgId || null, now, now],
  });

  // Notify all users in the org
  try {
    const users = await prisma.user.findMany({
      where: user.orgId ? { orgId: user.orgId } : {},
      select: { id: true },
    });
    for (const u of users) {
      if (u.id !== user.id) {
        await prisma.notification.create({
          data: {
            userId: u.id,
            type: "ANNOUNCEMENT",
            message: `📢 New announcement: ${title}`,
          },
        });
      }
    }
  } catch { /* notifications are non-critical */ }

  return NextResponse.json({ id, success: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.execute({ sql: `DELETE FROM Announcement WHERE id=?`, args: [id] });
  await db.execute({ sql: `DELETE FROM AnnouncementReaction WHERE announcementId=?`, args: [id] });
  return NextResponse.json({ success: true });
}
