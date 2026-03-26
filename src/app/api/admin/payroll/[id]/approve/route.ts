import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/api-guard";
import { getPrismaForOrg } from "@/lib/tenant";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const planGuard = await requireFeature("payroll");
  if (planGuard) return planGuard;
  const user = session.user as { id: string; role: string; orgId?: string };
  if (user.role !== "MANAGER" && user.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = await getPrismaForOrg(user.orgId ?? "");

  const { id } = await params;

  const entry = await prisma.payrollEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.status !== "DRAFT") {
    return NextResponse.json({ error: "Only DRAFT entries can be approved" }, { status: 400 });
  }

  const updated = await prisma.payrollEntry.update({
    where: { id },
    data: { status: "APPROVED" },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(updated);
}
