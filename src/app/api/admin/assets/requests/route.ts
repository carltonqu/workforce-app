import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requests = await prisma.assetRequest.findMany({ orderBy: { requestedAt: "desc" } });
  const enriched = await Promise.all(
    requests.map(async (r) => {
      const emp = await prisma.employee.findUnique({ where: { id: r.employeeId } });
      return { ...r, employeeName: emp?.fullName || "Unknown", department: emp?.department };
    })
  );
  return NextResponse.json(enriched);
}
