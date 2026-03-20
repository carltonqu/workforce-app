import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const assets = await prisma.asset.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const count = await prisma.asset.count();
  const assetCode = `AST-${String(count + 1).padStart(4, "0")}`;
  const asset = await prisma.asset.create({
    data: {
      assetCode,
      name: body.name,
      type: body.type,
      serialNumber: body.serialNumber || null,
      brand: body.brand || null,
      model: body.model || null,
      condition: body.condition || "Good",
      status: "Available",
      notes: body.notes || null,
      orgId: (session.user as any)?.orgId || null,
    },
  });
  return NextResponse.json(asset, { status: 201 });
}
