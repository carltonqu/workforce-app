import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const prisma = await getPrismaForOrg(user.orgId);
  const active = await prisma.timeEntry.findFirst({
    where: { employeeId: user.id, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEntries = await prisma.timeEntry.findMany({
    where: { employeeId: user.id, clockIn: { gte: today } },
    orderBy: { clockIn: "asc" },
  });
  return NextResponse.json({
    activeEntry: active ? { ...active, clockIn: active.clockIn.toISOString(), clockOut: null } : null,
    todayEntries: todayEntries.map(e => ({ ...e, clockIn: e.clockIn.toISOString(), clockOut: e.clockOut?.toISOString() ?? null })),
  });
}
