import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg } from "@/lib/tenant";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const prisma = await getPrismaForOrg(user.orgId);
  const employee = await prisma.employee.findFirst({ where: { email: user.email } });
  if (!employee) return NextResponse.json([]);
  const requests = await prisma.assetRequest.findMany({
    where: { employeeId: employee.id },
    orderBy: { requestedAt: "desc" },
  });
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const prisma = await getPrismaForOrg(user.orgId);
  const employee = await prisma.employee.findFirst({ where: { email: user.email } });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  const body = await req.json();
  const request = await prisma.assetRequest.create({
    data: {
      employeeId: employee.id,
      assetType: body.assetType,
      reason: body.reason,
      urgency: body.urgency || "Normal",
    },
  });
  return NextResponse.json(request, { status: 201 });
}
