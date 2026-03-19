import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id: string; role: string };
  if (user.role !== "MANAGER" && user.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const entry = await prisma.payrollEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.status !== "APPROVED") {
    return NextResponse.json({ error: "Only APPROVED entries can be released" }, { status: 400 });
  }

  const [updated] = await Promise.all([
    prisma.payrollEntry.update({
      where: { id },
      data: { status: "RELEASED" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.notification.create({
      data: {
        userId: entry.userId,
        type: "PAYROLL_RELEASED",
        message: `Your payroll has been released. Net pay: ₱${entry.netPay.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
