import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg } from "@/lib/tenant";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const userId = user.id;
  const prisma = await getPrismaForOrg(user.orgId);

  await prisma.notification.updateMany({
    where: { id: params.id, userId },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
