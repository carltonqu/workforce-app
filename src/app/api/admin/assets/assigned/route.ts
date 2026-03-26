import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/api-guard";
import { getPrismaForOrg } from "@/lib/tenant";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const planGuard = await requireFeature("assets");
  if (planGuard) return planGuard;
  const user = session.user as any;
  const prisma = await getPrismaForOrg(user.orgId);
  const assignments = await prisma.assetAssignment.findMany({
    where: { isActive: true },
    include: { asset: true },
    orderBy: { dateAssigned: "desc" },
  });
  const enriched = await Promise.all(
    assignments.map(async (a) => {
      const emp = await prisma.employee.findUnique({ where: { id: a.employeeDbId } });
      return {
        ...a,
        employee: emp
          ? {
              id: emp.id,
              employeeId: emp.employeeId,
              fullName: emp.fullName,
              department: emp.department,
              branchLocation: emp.branchLocation,
            }
          : null,
      };
    })
  );
  return NextResponse.json(enriched);
}
