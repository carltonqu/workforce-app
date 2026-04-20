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

  // Create demo admin user
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@demo.com",
      password: hashedPassword,
      role: "MANAGER",
      tier: "ADVANCED",
      orgId: org.id,
    },
  });

  console.log("Created admin user:", adminUser.email);

  // Create demo employees
  const employees = [
    {
      id: "emp-1",
      employeeId: "EMP001",
      fullName: "John Doe",
      email: "john@demo.com",
      department: "Engineering",
      position: "Developer",
      employmentStatus: "Active",
      orgId: org.id,
    },
    {
      id: "emp-2",
      employeeId: "EMP002",
      fullName: "Jane Smith",
      email: "jane@demo.com",
      department: "HR",
      position: "HR Manager",
      employmentStatus: "Active",
      orgId: org.id,
    },
    {
      id: "emp-3",
      employeeId: "EMP003",
      fullName: "Bob Wilson",
      email: "bob@demo.com",
      department: "Operations",
      position: "Staff",
      employmentStatus: "Active",
      orgId: org.id,
    },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: {},
      create: emp,
    });
  }

  console.log("Created employees:", employees.map((e) => e.email).join(", "));

  // Sample holidays
  const now = new Date();
  const holidays = [
    {
      date: new Date(now.getFullYear(), 0, 1),
      name: "New Year's Day",
      type: "Regular",
      orgId: org.id,
    },
    {
      date: new Date(now.getFullYear(), 11, 25),
      name: "Christmas Day",
      type: "Regular",
      orgId: org.id,
    },
  ];

  for (const holiday of holidays) {
    await prisma.holiday.upsert({
      where: {
        id: `${holiday.name}-${now.getFullYear()}`,
      },
      update: {},
      create: {
        ...holiday,
        id: `${holiday.name}-${now.getFullYear()}`,
      },
    });
  }

  console.log("Seed completed!");
  console.log("");
  console.log("Demo login credentials:");
  console.log("  Email: admin@demo.com");
  console.log("  Username: admin");
  console.log("  Password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
