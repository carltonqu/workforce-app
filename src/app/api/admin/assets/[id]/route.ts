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
  const body = await req.json();
  const asset = await prisma.asset.update({
    where: { id: params.id },
    data: {
      name: body.name,
      type: body.type,
      serialNumber: body.serialNumber || null,
      brand: body.brand || null,
      model: body.model || null,
      condition: body.condition,
      status: body.status,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(asset);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const planGuard = await requireFeature("assets");
  if (planGuard) return planGuard;
  const user = session.user as any;
  const prisma = await getPrismaForOrg(user.orgId);
  await prisma.asset.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
