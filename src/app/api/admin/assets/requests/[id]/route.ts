import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/api-guard";
import { getPrismaForOrg } from "@/lib/tenant";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const planGuard = await requireFeature("assets");
  if (planGuard) return planGuard;
  const user = session.user as any;
  const prisma = await getPrismaForOrg(user.orgId);
  const { status, adminComment } = await req.json();
  const updated = await prisma.assetRequest.update({
    where: { id: params.id },
    data: { status, adminComment: adminComment || null },
  });
  return NextResponse.json(updated);
}
