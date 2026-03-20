import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;
  const prisma = await getPrismaForOrg(user.orgId);

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
