import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg } from "@/lib/tenant";
import { randomUUID } from "crypto";

// GET /api/employees - list all employees for the org
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = await getPrismaForOrg(user.orgId);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const department = searchParams.get("department") || "";
  const branch = searchParams.get("branch") || "";
  const status = searchParams.get("status") || "";

  const employees = await (prisma as any).employee.findMany({
    where: {
      ...(user.orgId ? { orgId: user.orgId } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search } },
              { email: { contains: search } },
              { employeeId: { contains: search } },
            ],
          }
        : {}),
      ...(department ? { department } : {}),
      ...(branch ? { branchLocation: branch } : {}),
      ...(status ? { employmentStatus: status } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(employees);
}

// POST /api/employees - create new employee
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = await getPrismaForOrg(user.orgId);

  const body = await req.json();
  const {
    employeeId,
    fullName,
    profilePhoto,
    email,
    phoneNumber,
    address,
    emergencyContact,
    dateOfBirth,
    gender,
    hireDate,
    employmentStatus,
    department,
    position,
    branchLocation,
    reportingManager,
    employmentType,
    payrollType,
    salaryRate,
    governmentTaxIds,
    bankDetails,
    uploadedDocuments,
  } = body;

  if (!employeeId || !fullName || !email) {
    return NextResponse.json({ error: "Employee ID, full name, and email are required" }, { status: 400 });
  }

  // Check duplicate employeeId
  const existing = await (prisma as any).employee.findUnique({ where: { employeeId } });
  if (existing) {
    return NextResponse.json({ error: "Employee ID already exists" }, { status: 409 });
  }

  const employee = await (prisma as any).employee.create({
    data: {
      id: randomUUID(),
      employeeId,
      fullName,
      profilePhoto: profilePhoto || null,
      email,
      phoneNumber: phoneNumber || null,
      address: address || null,
      emergencyContact: emergencyContact ? JSON.stringify(emergencyContact) : null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
      gender: gender || null,
      hireDate: hireDate ? new Date(hireDate).toISOString() : null,
      employmentStatus: employmentStatus || "Active",
      department: department || null,
      position: position || null,
      branchLocation: branchLocation || null,
      reportingManager: reportingManager || null,
      employmentType: employmentType || null,
      payrollType: payrollType || null,
      salaryRate: salaryRate ? parseFloat(salaryRate) : null,
      governmentTaxIds: governmentTaxIds ? JSON.stringify(governmentTaxIds) : null,
      bankDetails: bankDetails ? JSON.stringify(bankDetails) : null,
      uploadedDocuments: uploadedDocuments ? JSON.stringify(uploadedDocuments) : null,
      orgId: user.orgId || null,
      updatedAt: new Date().toISOString(),
    },
  });

  return NextResponse.json(employee, { status: 201 });
}
