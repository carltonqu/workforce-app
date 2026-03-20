import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg } from "@/lib/tenant";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  const prisma = await getPrismaForOrg(user.orgId);
  const employee = await prisma.employee.findFirst({ where: { email: user.email } });
  if (!employee) return NextResponse.json([]);
  const assignments = await prisma.assetAssignment.findMany({
    where: { employeeDbId: employee.id, isActive: true },
    include: { asset: true },
    orderBy: { dateAssigned: "desc" },
  });
  return NextResponse.json(assignments);
}
