import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const prisma = await getPrismaForOrg(user.orgId);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const entries = await prisma.timeEntry.findMany({
    where: { employeeId: user.id, clockIn: { gte: startDate } },
    orderBy: { clockIn: "desc" },
  });
  return NextResponse.json(entries.map(e => ({
    ...e,
    clockIn: e.clockIn.toISOString(),
    clockOut: e.clockOut?.toISOString() ?? null,
  })));
}
