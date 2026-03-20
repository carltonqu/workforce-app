import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaForOrg, getTenantDb } from "@/lib/tenant";

async function findUserByEmployeeId(db: Awaited<ReturnType<typeof getTenantDb>>, prisma: Awaited<ReturnType<typeof getPrismaForOrg>>, employeeId: string) {
  try {
    // LeaveRequest.employeeId is actually the User.id directly
    const user = await prisma.user.findUnique({ where: { id: employeeId } });
    if (user) return user;
    // Fallback: try matching Employee.employeeId → email → User
    const empRow = await db.execute({
      sql: `SELECT email FROM Employee WHERE employeeId=? LIMIT 1`,
      args: [employeeId],
    });
    const emp = empRow.rows[0];
    if (!emp) return null;
    return await prisma.user.findUnique({ where: { email: emp.email as string } });
  } catch {
    return null;
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.role !== "MANAGER" && user.role !== "HR")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prisma = await getPrismaForOrg(user.orgId);
  const db = await getTenantDb(user.orgId);
  const body = await req.json();
  const now = new Date().toISOString();
  const { status, adminComment, isLeave } = body;

  if (isLeave) {
    await db.execute({
      sql: `UPDATE LeaveRequest SET status=?, adminComment=?, updatedAt=? WHERE id=?`,
      args: [status, adminComment || null, now, params.id],
    });

    // Fetch leave request for notifications/deductions
    const leaveRow = await db.execute({
      sql: `SELECT * FROM LeaveRequest WHERE id=?`,
      args: [params.id],
    });
    const leave = leaveRow.rows[0];

    if (leave) {
      const empUser = await findUserByEmployeeId(db, prisma, leave.employeeId as string);

      // Send notification to employee
      if (empUser) {
        const days = Number(leave.days);
        const dayLabel = days !== 1 ? "days" : "day";
        if (status === "Approved") {
          await prisma.notification.create({
            data: {
              userId: empUser.id,
              type: "LEAVE_APPROVED",
              message: `Your ${leave.leaveType} leave request (${days} ${dayLabel}) from ${leave.startDate} to ${leave.endDate} has been Approved.`,
            },
          });

          // Upsert LeaveBalance — create row with defaults if missing, then deduct
          try {
            const leaveType = leave.leaveType as string;
            const balRow = await db.execute({
              sql: `SELECT * FROM LeaveBalance WHERE userId=? AND leaveType=? AND year=? LIMIT 1`,
              args: [empUser.id, leaveType, new Date().getFullYear()],
            });
            const bal = balRow.rows[0];

            if (bal) {
              // Row exists — deduct
              const newUsed = Number(bal.usedDays) + days;
              const newRemaining = Math.max(0, Number(bal.remainingDays) - days);
              await db.execute({
                sql: `UPDATE LeaveBalance SET usedDays=?, remainingDays=?, updatedAt=? WHERE id=?`,
                args: [newUsed, newRemaining, now, bal.id],
              });
            } else {
              // Row doesn't exist — create with default totals then deduct
              const defaultTotals: Record<string, number> = {
                Vacation: 15,
                Sick: 10,
                Emergency: 3,
                Maternity: 105,
                Paternity: 7,
                Bereavement: 3,
              };
              const totalDays = defaultTotals[leaveType] ?? 15;
              const usedDays = days;
              const remainingDays = Math.max(0, totalDays - days);
              const newId = crypto.randomUUID();
              await db.execute({
                sql: `INSERT INTO LeaveBalance (id, userId, leaveType, totalDays, usedDays, remainingDays, year, orgId, updatedAt) VALUES (?,?,?,?,?,?,?,?,?)`,
                args: [newId, empUser.id, leaveType, totalDays, usedDays, remainingDays, new Date().getFullYear(), (empUser as any).orgId ?? null, now],
              });
            }
          } catch (e) {
            console.error("LeaveBalance deduction failed:", e);
          }
        } else if (status === "Rejected") {
          await prisma.notification.create({
            data: {
              userId: empUser.id,
              type: "LEAVE_REJECTED",
              message: `Your ${leave.leaveType} leave request from ${leave.startDate} to ${leave.endDate} has been Rejected.${adminComment ? " Note: " + adminComment : ""}`,
            },
          });
        }
      }
    }
  } else {
    await db.execute({
      sql: `UPDATE ApprovalRequest SET status=?, adminComment=?, updatedAt=? WHERE id=?`,
      args: [status, adminComment || null, now, params.id],
    });

    // Send notification for non-leave approval requests (OT, etc.)
    const requestRow = await db.execute({
      sql: `SELECT * FROM ApprovalRequest WHERE id=?`,
      args: [params.id],
    });
    const request = requestRow.rows[0];

    if (request) {
      const empUser = await findUserByEmployeeId(db, prisma, request.employeeId as string);
      if (empUser) {
        const requestType = request.requestType as string;
        const isOTRequest =
          requestType?.toLowerCase().includes("ot") ||
          requestType?.toLowerCase().includes("overtime");

        let message: string;
        if (isOTRequest && status === "Approved") {
          message = "Your overtime request has been approved. You may now clock in for OT.";
        } else {
          message = `Your ${requestType} request has been ${status}.${adminComment ? " Note: " + adminComment : ""}`;
        }

        await prisma.notification.create({
          data: {
            userId: empUser.id,
            type: `REQUEST_${status.toUpperCase()}`,
            message,
          },
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}
