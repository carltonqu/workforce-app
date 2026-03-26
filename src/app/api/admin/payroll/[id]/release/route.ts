import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/api-guard";
import { getPrismaForOrg } from "@/lib/tenant";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

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
  if (entry.status !== "APPROVED") {
    return NextResponse.json({ error: "Only APPROVED entries can be released" }, { status: 400 });
  }

  const periodStartFormatted = formatDate(entry.periodStart);
  const periodEndFormatted = formatDate(entry.periodEnd);
  const netPayFormatted = entry.netPay.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
        message: `Your payslip for the period ${periodStartFormatted} – ${periodEndFormatted} is now available. Net Pay: ₱${netPayFormatted}. View it in My Payslips.`,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
