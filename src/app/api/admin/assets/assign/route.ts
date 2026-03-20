import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const prisma = await getPrismaForOrg(user.orgId);
  const { assetId, employeeDbId, conditionOnAssign, notes } = await req.json();
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset || asset.status !== "Available")
    return NextResponse.json({ error: "Asset is not available" }, { status: 400 });
  const employee = await prisma.employee.findUnique({ where: { id: employeeDbId } });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  const assignment = await prisma.assetAssignment.create({
    data: {
      assetId,
      employeeId: employee.employeeId,
      employeeDbId,
      assignedBy: user?.id || "unknown",
      conditionOnAssign: conditionOnAssign || asset.condition,
      notes: notes || null,
    },
  });
  await prisma.asset.update({ where: { id: assetId }, data: { status: "Assigned" } });
  return NextResponse.json(assignment, { status: 201 });
}
