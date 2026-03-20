import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  const userId = user.id;
  const prisma = await getPrismaForOrg(user.orgId);

  // Check if already clocked in
  const existing = await prisma.timeEntry.findFirst({
    where: { userId, clockOut: null },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Already clocked in" },
      { status: 400 }
    );
  }

  const entry = await prisma.timeEntry.create({
    data: {
      userId,
      clockIn: new Date(),
    },
  });

  return NextResponse.json(entry);
}
