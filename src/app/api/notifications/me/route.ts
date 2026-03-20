import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg } from "@/lib/tenant";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const userId = user.id;
  const prisma = await getPrismaForOrg(user.orgId);

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(
    notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    }))
  );
}
