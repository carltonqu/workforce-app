import { NextRequest, NextResponse } from "next/server";
import { prisma as masterPrisma } from "@/lib/prisma";
import { getPrismaForOrg } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  // Security: only callable server-side or via cron secret
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET || "internal";
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);

  // Get all orgs that have their own DB (tenant orgs)
  const orgs = await (masterPrisma as any).organization.findMany({
    select: { id: true },
  });

  let totalAutoClocked = 0;
  const allIds: string[] = [];

  for (const org of orgs) {
    try {
      const prisma = await getPrismaForOrg(org.id);

      const openEntries = await prisma.timeEntry.findMany({
        where: { clockOut: null, clockIn: { lte: eightHoursAgo } },
      });

      for (const entry of openEntries) {
        const clockOut = new Date(entry.clockIn.getTime() + 8 * 60 * 60 * 1000);
        await prisma.timeEntry.update({
          where: { id: entry.id },
          data: { clockOut, overtimeMinutes: 0 },
        });
        await prisma.notification.create({
          data: {
            userId: entry.employeeId,
            type: "AUTO_CLOCKOUT",
            message:
              "You were automatically clocked out after 8 hours. If you worked overtime, use the OT Clock In button.",
          },
        });
        allIds.push(entry.id);
        totalAutoClocked++;
      }
    } catch (err) {
      console.error(`[auto-clockout] Error processing org ${org.id}:`, err);
    }
  }

  return NextResponse.json({ autoClocked: totalAutoClocked, ids: allIds });
}
