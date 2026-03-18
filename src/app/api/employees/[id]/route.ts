import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/employees/:id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const employee = await (prisma as any).employee.findUnique({ where: { id: params.id } });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(employee);
}

// PATCH /api/employees/:id - update employee
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  // Check for duplicate employeeId (only if changing it)
  if (employeeId) {
    const existing = await (prisma as any).employee.findFirst({
      where: { employeeId, NOT: { id: params.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Employee ID already used by another employee" }, { status: 409 });
    }
  }

  const updateData: any = {
    updatedAt: new Date().toISOString(),
  };

  if (employeeId !== undefined) updateData.employeeId = employeeId;
  if (fullName !== undefined) updateData.fullName = fullName;
  if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto || null;
  if (email !== undefined) updateData.email = email;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null;
  if (address !== undefined) updateData.address = address || null;
  if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact ? JSON.stringify(emergencyContact) : null;
  if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth).toISOString() : null;
  if (gender !== undefined) updateData.gender = gender || null;
  if (hireDate !== undefined) updateData.hireDate = hireDate ? new Date(hireDate).toISOString() : null;
  if (employmentStatus !== undefined) updateData.employmentStatus = employmentStatus;
  if (department !== undefined) updateData.department = department || null;
  if (position !== undefined) updateData.position = position || null;
  if (branchLocation !== undefined) updateData.branchLocation = branchLocation || null;
  if (reportingManager !== undefined) updateData.reportingManager = reportingManager || null;
  if (employmentType !== undefined) updateData.employmentType = employmentType || null;
  if (payrollType !== undefined) updateData.payrollType = payrollType || null;
  if (salaryRate !== undefined) updateData.salaryRate = salaryRate ? parseFloat(salaryRate) : null;
  if (governmentTaxIds !== undefined) updateData.governmentTaxIds = governmentTaxIds ? JSON.stringify(governmentTaxIds) : null;
  if (bankDetails !== undefined) updateData.bankDetails = bankDetails ? JSON.stringify(bankDetails) : null;
  if (uploadedDocuments !== undefined) updateData.uploadedDocuments = uploadedDocuments ? JSON.stringify(uploadedDocuments) : null;

  const employee = await (prisma as any).employee.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json(employee);
}

// DELETE /api/employees/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await (prisma as any).employee.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
