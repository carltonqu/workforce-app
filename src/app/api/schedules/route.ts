import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { scheduleId, orgId, weekStart, shifts } = await req.json();

  if (!orgId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const schedule = scheduleId
    ? await prisma.schedule.update({
        where: { id: scheduleId },
        data: { shifts: JSON.stringify(shifts) },
      })
    : await prisma.schedule.create({
        data: {
          orgId,
          weekStart: new Date(weekStart),
          shifts: JSON.stringify(shifts),
        },
      });

  return NextResponse.json(schedule);
}
