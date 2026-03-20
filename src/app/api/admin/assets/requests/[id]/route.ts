import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { status, adminComment } = await req.json();
  const updated = await prisma.assetRequest.update({
    where: { id: params.id },
    data: { status, adminComment: adminComment || null },
  });
  return NextResponse.json(updated);
}
