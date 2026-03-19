import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // Security: only callable server-side or via cron secret
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET || "internal";
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);

  // Find all open time entries where clockIn was >= 8 hours ago
  const openEntries = await prisma.timeEntry.findMany({
    where: { clockOut: null, clockIn: { lte: eightHoursAgo } },
  });

  const results = [];
  for (const entry of openEntries) {
    const clockOut = new Date(entry.clockIn.getTime() + 8 * 60 * 60 * 1000); // exactly 8h after clock in
    await prisma.timeEntry.update({
      where: { id: entry.id },
      data: { clockOut, overtimeMinutes: 0 },
    });
    // Notify employee
    await prisma.notification.create({
      data: {
        userId: entry.userId,
        type: "AUTO_CLOCKOUT",
        message:
          "You were automatically clocked out after 8 hours. If you worked overtime, use the OT Clock In button.",
      },
    });
    results.push(entry.id);
  }

  return NextResponse.json({ autoClocked: results.length, ids: results });
}
