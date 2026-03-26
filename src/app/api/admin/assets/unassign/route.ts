import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/api-guard";
import { getPrismaForOrg } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const planGuard = await requireFeature("assets");
  if (planGuard) return planGuard;
  const user = session.user as any;
  const prisma = await getPrismaForOrg(user.orgId);
  const { assignmentId, newCondition } = await req.json();
  const assignment = await prisma.assetAssignment.update({
    where: { id: assignmentId },
    data: { isActive: false, dateReturned: new Date() },
  });
  await prisma.asset.update({
    where: { id: assignment.assetId },
    data: { status: "Available", ...(newCondition ? { condition: newCondition } : {}) },
  });
  return NextResponse.json({ success: true });
}
