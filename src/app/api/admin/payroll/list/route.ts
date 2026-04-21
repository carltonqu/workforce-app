import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg } from "@/lib/tenant";
import { requireFeature } from "@/lib/api-guard";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id: string; role: string; orgId?: string };
  if (user.role !== "MANAGER" && user.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const planGuard = await requireFeature("payroll");
  if (planGuard) return planGuard;
  const prisma = await getPrismaForOrg(user.orgId ?? "");

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (status) where.status = status;

  const entries = await prisma.payrollEntry.findMany({
    where,
    orderBy: { periodEnd: "desc" },
    take: 200,
  });

  return NextResponse.json(entries);
}
