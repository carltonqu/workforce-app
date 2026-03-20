import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg, getTenantDb } from "@/lib/tenant";
import { randomUUID } from "crypto";

async function ensureTables(db: Awaited<ReturnType<typeof getTenantDb>>) {
  await db.execute(`CREATE TABLE IF NOT EXISTS Announcement (id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, type TEXT DEFAULT 'general', createdBy TEXT NOT NULL, createdByName TEXT, orgId TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS AnnouncementReaction (id TEXT PRIMARY KEY, announcementId TEXT NOT NULL, userId TEXT NOT NULL, emoji TEXT NOT NULL, createdAt TEXT NOT NULL, UNIQUE(announcementId, userId, emoji))`);
  // Add new columns safely
  const newCols = [
    `ALTER TABLE Announcement ADD COLUMN imageBase64 TEXT`,
    `ALTER TABLE Announcement ADD COLUMN status TEXT DEFAULT 'published'`,
    `ALTER TABLE Announcement ADD COLUMN scheduledAt TEXT`,
    `ALTER TABLE Announcement ADD COLUMN targetBranch TEXT`,
    `ALTER TABLE Announcement ADD COLUMN targetDepartment TEXT`,
    `ALTER TABLE Announcement ADD COLUMN publishedAt TEXT`,
  ];
  for (const sql of newCols) {
    try { await db.execute(sql); } catch { /* column already exists */ }
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const db = await getTenantDb(user.orgId);
  await ensureTables(db);

  const isAdmin = user.role === "MANAGER" || user.role === "HR";
  const userId = user.id;

  // Get user's branch/dept for filtering
  let userBranch: string | null = null;
  let userDept: string | null = null;
  try {
    const empRow = await db.execute({
      sql: `SELECT branchLocation, department FROM Employee WHERE email=(SELECT email FROM User WHERE id=? LIMIT 1) LIMIT 1`,
      args: [userId],
    });
    if (empRow.rows[0]) {
      userBranch = empRow.rows[0].branchLocation as string | null;
      userDept = empRow.rows[0].department as string | null;
    }
  } catch {}

  // Auto-publish scheduled announcements that are due
  const now = new Date().toISOString();
  try {
    await db.execute({
      sql: `UPDATE Announcement SET status='published', publishedAt=? WHERE status='scheduled' AND scheduledAt <= ?`,
      args: [now, now],
    });
  } catch {}

  const sql = isAdmin
    ? `SELECT * FROM Announcement ORDER BY CASE WHEN status='published' THEN 0 WHEN status='scheduled' THEN 1 ELSE 2 END, createdAt DESC LIMIT 100`
    : `SELECT * FROM Announcement WHERE status='published' ORDER BY publishedAt DESC, createdAt DESC LIMIT 50`;

  const announcements = await db.execute(sql);
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

  // Filter by targeting for non-admins
  const filtered = announcements.rows.filter(a => {
    if (isAdmin) return true;
    const tb = a.targetBranch as string | null;
    const td = a.targetDepartment as string | null;
    if (tb && userBranch && tb !== userBranch) return false;
    if (td && userDept && td !== userDept) return false;
    return true;
  });

  return NextResponse.json(filtered.map(a => ({
    ...a,
    reactions: reactionMap[a.id as string] || [],
  })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = await getTenantDb(user.orgId);
  const prisma = await getPrismaForOrg(user.orgId);
  await ensureTables(db);
  const body = await req.json();
  const {
    title,
    body: announcementBody,
    type,
    imageBase64,
    status,
    scheduledAt,
    targetBranch,
    targetDepartment,
  } = body;

  if (!title || !announcementBody) return NextResponse.json({ error: "Title and body required" }, { status: 400 });

  const id = randomUUID();
  const now = new Date().toISOString();
  const finalStatus = status || "published";
  const publishedAt = finalStatus === "published" ? now : null;

  await db.execute({
    sql: `INSERT INTO Announcement (id, title, body, type, imageBase64, status, scheduledAt, targetBranch, targetDepartment, publishedAt, createdBy, createdByName, orgId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [id, title, announcementBody, type || "general", imageBase64 || null, finalStatus, scheduledAt || null, targetBranch || null, targetDepartment || null, publishedAt, user.id, user.name || "Admin", user.orgId || null, now, now],
  });

  // Only notify if publishing now
  if (finalStatus === "published") {
    try {
      const users = await prisma.user.findMany({
        where: user.orgId ? { orgId: user.orgId } : {},
        select: { id: true, email: true },
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
  }

  return NextResponse.json({ id, status: finalStatus, success: true }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = await getTenantDb(user.orgId);
  const prisma = await getPrismaForOrg(user.orgId);
  const body = await req.json();
  const { id, title, body: announcementBody, type, imageBase64, status, scheduledAt, targetBranch, targetDepartment } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const now = new Date().toISOString();
  const finalStatus = status || "published";
  const publishedAt = finalStatus === "published" ? now : null;

  await db.execute({
    sql: `UPDATE Announcement SET title=?, body=?, type=?, imageBase64=?, status=?, scheduledAt=?, targetBranch=?, targetDepartment=?, publishedAt=?, updatedAt=? WHERE id=?`,
    args: [title, announcementBody, type || "general", imageBase64 || null, finalStatus, scheduledAt || null, targetBranch || null, targetDepartment || null, publishedAt, now, id],
  });

  // If publishing now, send notifications
  if (finalStatus === "published") {
    try {
      const users = await prisma.user.findMany({
        where: user.orgId ? { orgId: user.orgId } : {},
        select: { id: true },
      });
      for (const u of users) {
        if (u.id !== user.id) {
          await prisma.notification.create({
            data: { userId: u.id, type: "ANNOUNCEMENT", message: `📢 New announcement: ${title}` },
          });
        }
      }
    } catch { /* notifications are non-critical */ }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await getTenantDb(user.orgId);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.execute({ sql: `DELETE FROM Announcement WHERE id=?`, args: [id] });
  await db.execute({ sql: `DELETE FROM AnnouncementReaction WHERE announcementId=?`, args: [id] });
  return NextResponse.json({ success: true });
}
