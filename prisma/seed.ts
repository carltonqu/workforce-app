import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;
const adapter = new PrismaLibSql({ url: dbUrl, authToken });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("Seeding database...");

  // Create organization
  const org = await prisma.organization.upsert({
    where: { id: "demo-org-id" },
    update: {},
    create: {
      id: "demo-org-id",
      name: "Demo Company",
      tier: "ADVANCED",
    },
  });

  console.log("Created org:", org.name);

  const password = await bcrypt.hash("password123", 10);

  // Admin user - MANAGER, ADVANCED
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@demo.com",
      password,
      role: "MANAGER",
      tier: "ADVANCED",
      orgId: org.id,
    },
  });

  // Pro user - MANAGER, PRO
  const proUser = await prisma.user.upsert({
    where: { email: "pro@demo.com" },
    update: {},
    create: {
      name: "Pro User",
      email: "pro@demo.com",
      password,
      role: "HR",
      tier: "PRO",
      orgId: org.id,
    },
  });

  // Free user - EMPLOYEE, FREE
  const freeUser = await prisma.user.upsert({
    where: { email: "free@demo.com" },
    update: {},
    create: {
      name: "Free User",
      email: "free@demo.com",
      password,
      role: "EMPLOYEE",
      tier: "FREE",
      orgId: org.id,
    },
  });

  console.log("Created users:", admin.email, proUser.email, freeUser.email);

  // Sample time entries
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(9, 0, 0, 0);

  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(18, 30, 0, 0);

  await prisma.timeEntry.create({
    data: {
      userId: admin.id,
      clockIn: yesterday,
      clockOut: yesterdayEnd,
      overtimeMinutes: 30,
    },
  });

  await prisma.timeEntry.create({
    data: {
      userId: freeUser.id,
      clockIn: yesterday,
      clockOut: yesterdayEnd,
      overtimeMinutes: 0,
    },
  });

  // Sample notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        type: "SHIFT_APPROVED",
        message: "Your shift on Monday has been approved.",
        read: false,
      },
      {
        userId: admin.id,
        type: "PAYROLL_READY",
        message: "Payroll for March 1-15 is ready for review.",
        read: false,
      },
      {
        userId: proUser.id,
        type: "SHIFT_REQUEST",
        message: "Free User has requested a shift swap for Friday.",
        read: false,
      },
    ],
  });

  // Sample payroll entry
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 15);

  await prisma.payrollEntry.create({
    data: {
      userId: admin.id,
      periodStart,
      periodEnd,
      regularHours: 80,
      overtimeHours: 5,
      payRate: 25,
      deductions: 200,
      total: 80 * 25 + 5 * 25 * 1.5 - 200,
    },
  });

  // Sample schedule
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const shifts = [
    {
      id: "shift-1",
      employeeId: admin.id,
      employeeName: "Admin User",
      day: "Monday",
      startTime: "09:00",
      endTime: "17:00",
      role: "Manager",
    },
    {
      id: "shift-2",
      employeeId: freeUser.id,
      employeeName: "Free User",
      day: "Monday",
      startTime: "10:00",
      endTime: "18:00",
      role: "Employee",
    },
    {
      id: "shift-3",
      employeeId: proUser.id,
      employeeName: "Pro User",
      day: "Tuesday",
      startTime: "09:00",
      endTime: "17:00",
      role: "HR",
    },
  ];

  await prisma.schedule.create({
    data: {
      orgId: org.id,
      weekStart,
      shifts: JSON.stringify(shifts),
    },
  });

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
