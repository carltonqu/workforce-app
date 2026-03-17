import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const OVERTIME_THRESHOLD_MINUTES = 8 * 60; // 8 hours

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entryId } = await req.json();
  const userId = (session.user as any).id;

  const entry = await prisma.timeEntry.findFirst({
    where: { id: entryId, userId, clockOut: null },
  });

  if (!entry) {
    return NextResponse.json({ error: "Active entry not found" }, { status: 404 });
  }

  const clockOut = new Date();
  const durationMinutes = Math.floor(
    (clockOut.getTime() - entry.clockIn.getTime()) / 60000
  );
  const overtimeMinutes = Math.max(0, durationMinutes - OVERTIME_THRESHOLD_MINUTES);

  const updated = await prisma.timeEntry.update({
    where: { id: entryId },
    data: { clockOut, overtimeMinutes },
  });

  // Create overtime notification if applicable
  if (overtimeMinutes > 0) {
    await prisma.notification.create({
      data: {
        userId,
        type: "OVERTIME_ALERT",
        message: `You worked ${overtimeMinutes} minutes of overtime today.`,
      },
    });
  }

  return NextResponse.json(updated);
}
