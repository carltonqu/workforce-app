import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg } from "@/lib/tenant";

const STANDARD_SHIFT_HOURS = 8;
const OVERTIME_THRESHOLD_MINUTES = 8 * 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const userId = user.id;
  const prisma = await getPrismaForOrg(user.orgId);

  const body = await req.json().catch(() => ({}));
  const isUndertimeConfirmed = body.undertimeConfirmed === true;

  // Find the active (open) time entry for this user
  const entry = await prisma.timeEntry.findFirst({
    where: { userId: userId, clockOut: null },
    orderBy: { clockIn: "desc" },
  });

  if (!entry) return NextResponse.json({ error: "No active clock-in found" }, { status: 404 });

  const clockOut = new Date();
  const workedMinutes = Math.floor((clockOut.getTime() - entry.clockIn.getTime()) / 60000);
  const standardMinutes = STANDARD_SHIFT_HOURS * 60;

  // If less than 8 hours AND not confirmed → return undertime info
  if (workedMinutes < standardMinutes && !isUndertimeConfirmed) {
    const undertimeMinutes = standardMinutes - workedMinutes;
    const hours = Math.floor(workedMinutes / 60);
    const mins = workedMinutes % 60;
    return NextResponse.json({
      requiresConfirmation: true,
      workedMinutes,
      undertimeMinutes,
      workedFormatted: `${hours}h ${mins}m`,
      message: `You have only worked ${hours}h ${mins}m. Clocking out now will mark you as UNDERTIME (${Math.floor(undertimeMinutes / 60)}h ${undertimeMinutes % 60}m short).`,
    }, { status: 200 });
  }

  const overtimeMinutes = Math.max(0, workedMinutes - OVERTIME_THRESHOLD_MINUTES);

  const updated = await prisma.timeEntry.update({
    where: { id: entry.id },
    data: {
      clockOut,
      overtimeMinutes,
    },
  });

  // Notification
  if (overtimeMinutes > 0) {
    await prisma.notification.create({
      data: {
        userId,
        type: "OVERTIME_ALERT",
        message: `You worked ${Math.floor(overtimeMinutes / 60)}h ${overtimeMinutes % 60}m of overtime today.`,
      },
    });
  }

  if (workedMinutes < standardMinutes && isUndertimeConfirmed) {
    const undertimeMinutes = standardMinutes - workedMinutes;
    await prisma.notification.create({
      data: {
        userId,
        type: "UNDERTIME",
        message: `Undertime recorded: You left ${Math.floor(undertimeMinutes / 60)}h ${undertimeMinutes % 60}m early today.`,
      },
    });
  }

  return NextResponse.json({
    ...updated,
    clockIn: updated.clockIn.toISOString(),
    clockOut: updated.clockOut?.toISOString() ?? null,
    workedMinutes,
    overtimeMinutes,
    isUndertime: workedMinutes < standardMinutes,
  });
}
