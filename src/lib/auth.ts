import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { createClient } from "@libsql/client";

// Turso tenant database provisioning
async function provisionTenantDb(orgSlug: string): Promise<{ dbUrl: string; dbAuthToken: string }> {
  const apiToken = process.env.TURSO_API_TOKEN;
  const org = process.env.TURSO_ORG_SLUG;
  
  if (!apiToken || !org) {
    throw new Error("Turso credentials not configured");
  }

  const dbName = `workforce-${orgSlug}-${Date.now()}`;
  
  // Create database
  const createRes = await fetch(`https://api.turso.tech/v1/organizations/${org}/databases`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: dbName,
      group: "default",
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Turso database: ${await createRes.text()}`);
  }

  const dbData = await createRes.json();
  const dbUrl = dbData.database.Hostname 
    ? `libsql://${dbData.database.Hostname}`
    : `libsql://${dbName}-${org}.turso.io`;

  // Create token
  const tokenRes = await fetch(
    `https://api.turso.tech/v1/organizations/${org}/databases/${dbName}/auth/tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    }
  );

  if (!tokenRes.ok) {
    throw new Error(`Failed to create Turso token: ${await tokenRes.text()}`);
  }

  const tokenData = await tokenRes.json();
  
  return {
    dbUrl,
    dbAuthToken: tokenData.jwt,
  };
}

// Initialize tenant schema
async function initTenantSchema(dbUrl: string, dbAuthToken: string) {
  const client = createClient({
    url: dbUrl,
    authToken: dbAuthToken,
  });

  // Create all necessary tables in tenant DB
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "Organization" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "tier" TEXT NOT NULL DEFAULT 'FREE',
      "dbUrl" TEXT,
      "dbAuthToken" TEXT,
      "trialEndsAt" TEXT,
      "stripeCustomerId" TEXT,
      "stripeSubscriptionId" TEXT,
      "stripeStatus" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT,
      "email" TEXT NOT NULL,
      "emailVerified" DATETIME,
      "image" TEXT,
      "password" TEXT,
      "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
      "tier" TEXT NOT NULL DEFAULT 'FREE',
      "orgId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "Employee" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "employeeId" TEXT NOT NULL,
      "fullName" TEXT NOT NULL,
      "profilePhoto" TEXT,
      "email" TEXT NOT NULL,
      "phoneNumber" TEXT,
      "address" TEXT,
      "emergencyContact" TEXT,
      "dateOfBirth" DATETIME,
      "gender" TEXT,
      "hireDate" DATETIME,
      "employmentStatus" TEXT NOT NULL DEFAULT 'Active',
      "department" TEXT,
      "position" TEXT,
      "branchLocation" TEXT,
      "reportingManager" TEXT,
      "employmentType" TEXT,
      "payrollType" TEXT,
      "salaryRate" REAL,
      "governmentTaxIds" TEXT,
      "bankDetails" TEXT,
      "uploadedDocuments" TEXT,
      "orgId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "TimeEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "clockIn" DATETIME NOT NULL,
      "clockOut" DATETIME,
      "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "PayrollEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "periodStart" DATETIME NOT NULL,
      "periodEnd" DATETIME NOT NULL,
      "periodType" TEXT NOT NULL DEFAULT 'MONTHLY',
      "status" TEXT NOT NULL DEFAULT 'DRAFT',
      "rateType" TEXT NOT NULL DEFAULT 'MONTHLY',
      "rate" REAL NOT NULL DEFAULT 0,
      "dailyRate" REAL NOT NULL DEFAULT 0,
      "hourlyRate" REAL NOT NULL DEFAULT 0,
      "daysWorked" REAL NOT NULL DEFAULT 0,
      "hoursWorked" REAL NOT NULL DEFAULT 0,
      "lateMinutes" REAL NOT NULL DEFAULT 0,
      "undertimeMinutes" REAL NOT NULL DEFAULT 0,
      "absenceDays" REAL NOT NULL DEFAULT 0,
      "basicPay" REAL NOT NULL DEFAULT 0,
      "lateDeduction" REAL NOT NULL DEFAULT 0,
      "undertimeDeduction" REAL NOT NULL DEFAULT 0,
      "absenceDeduction" REAL NOT NULL DEFAULT 0,
      "otPay" REAL NOT NULL DEFAULT 0,
      "nightDiffPay" REAL NOT NULL DEFAULT 0,
      "holidayPay" REAL NOT NULL DEFAULT 0,
      "allowancesJson" TEXT NOT NULL DEFAULT '[]',
      "totalAllowances" REAL NOT NULL DEFAULT 0,
      "grossPay" REAL NOT NULL DEFAULT 0,
      "sssEmployee" REAL NOT NULL DEFAULT 0,
      "sssEmployer" REAL NOT NULL DEFAULT 0,
      "philhealthEmployee" REAL NOT NULL DEFAULT 0,
      "philhealthEmployer" REAL NOT NULL DEFAULT 0,
      "pagibigEmployee" REAL NOT NULL DEFAULT 0,
      "pagibigEmployer" REAL NOT NULL DEFAULT 0,
      "withholdingTax" REAL NOT NULL DEFAULT 0,
      "taxableIncome" REAL NOT NULL DEFAULT 0,
      "otherDeductionsJson" TEXT NOT NULL DEFAULT '[]',
      "totalOtherDeductions" REAL NOT NULL DEFAULT 0,
      "netPay" REAL NOT NULL DEFAULT 0,
      "regularHours" REAL NOT NULL DEFAULT 0,
      "overtimeHours" REAL NOT NULL DEFAULT 0,
      "payRate" REAL NOT NULL DEFAULT 0,
      "deductions" REAL NOT NULL DEFAULT 0,
      "total" REAL NOT NULL DEFAULT 0,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "read" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "Schedule" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "orgId" TEXT NOT NULL,
      "weekStart" DATETIME NOT NULL,
      "shifts" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "Holiday" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "date" DATETIME NOT NULL,
      "name" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "orgId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "Asset" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "assetCode" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "serialNumber" TEXT,
      "brand" TEXT,
      "model" TEXT,
      "condition" TEXT NOT NULL DEFAULT 'Good',
      "status" TEXT NOT NULL DEFAULT 'Available',
      "notes" TEXT,
      "orgId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "AssetAssignment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "assetId" TEXT NOT NULL,
      "employeeId" TEXT NOT NULL,
      "employeeDbId" TEXT NOT NULL,
      "assignedBy" TEXT NOT NULL,
      "conditionOnAssign" TEXT NOT NULL DEFAULT 'Good',
      "dateAssigned" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dateReturned" DATETIME,
      "isActive" INTEGER NOT NULL DEFAULT 1,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "AssetRequest" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "employeeId" TEXT NOT NULL,
      "assetId" TEXT,
      "assetType" TEXT NOT NULL,
      "reason" TEXT NOT NULL,
      "urgency" TEXT NOT NULL DEFAULT 'Normal',
      "status" TEXT NOT NULL DEFAULT 'Pending',
      "adminComment" TEXT,
      "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);

  await client.close();
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).toLowerCase() },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tier: user.tier,
          orgId: user.orgId,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after sign in
      if (url.includes('/login') || url.includes('/api/auth')) {
        return `${baseUrl}/dashboard`;
      }
      return url;
    },
    async signIn({ user, account }) {
      // For Google sign-in, create org with separate database if new user
      if (account?.provider === "google" && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          // Create new organization with dedicated Turso database
          let dbUrl: string | undefined;
          let dbAuthToken: string | undefined;

          try {
            const orgSlug = (user.name || "org")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .slice(0, 20);
            
            const tenantDb = await provisionTenantDb(orgSlug);
            dbUrl = tenantDb.dbUrl;
            dbAuthToken = tenantDb.dbAuthToken;

            // Initialize schema on the new database
            await initTenantSchema(dbUrl, dbAuthToken);
          } catch (err) {
            console.error("Failed to provision tenant DB:", err);
            // Continue without separate DB - will use master DB
          }

          // Create organization in master DB
          const org = await prisma.organization.create({
            data: {
              name: `${user.name || "My"}'s Organization`,
              tier: "FREE",
              trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 day trial
              ...(dbUrl ? { dbUrl, dbAuthToken } : {}),
            },
          });

          // Create user linked to org
          await prisma.user.create({
            data: {
              name: user.name || "User",
              email: user.email,
              image: user.image,
              role: "MANAGER",
              tier: "FREE",
              orgId: org.id,
            },
          });

          // Also create user in tenant DB if provisioned
          if (dbUrl && dbAuthToken) {
            try {
              const tenantClient = createClient({
                url: dbUrl,
                authToken: dbAuthToken,
              });

              const now = new Date().toISOString();
              await tenantClient.execute({
                sql: `INSERT INTO "Organization" (id, name, tier, createdAt, updatedAt) VALUES (?, ?, 'FREE', ?, ?)`,
                args: [org.id, org.name, now, now],
              });

              await tenantClient.execute({
                sql: `INSERT INTO "User" (id, name, email, role, tier, orgId, createdAt, updatedAt) VALUES (?, ?, ?, 'MANAGER', 'FREE', ?, ?, ?)`,
                args: [crypto.randomUUID(), user.name || "User", user.email, org.id, now, now],
              });

              await tenantClient.close();
            } catch (err) {
              console.error("Failed to seed tenant DB:", err);
            }
          }
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tier = (user as any).tier;
        token.orgId = (user as any).orgId;
      }

      // Refresh token data from DB
      if (trigger === "update" && session) {
        token.tier = session.tier;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).tier = token.tier;
        (session.user as any).orgId = token.orgId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

// Helper to get Prisma client for user's org (tenant DB or master)
export async function getPrismaForOrg(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { dbUrl: true, dbAuthToken: true },
  });

  if (org?.dbUrl && org?.dbAuthToken) {
    // Return tenant DB connection
    const { PrismaClient } = await import("@prisma/client");
    const { PrismaLibSql } = await import("@prisma/adapter-libsql");
    const { createClient } = await import("@libsql/client");

    const client = createClient({
      url: org.dbUrl,
      authToken: org.dbAuthToken,
    });

    const adapter = new PrismaLibSql(client as any);
    return new PrismaClient({ adapter } as any);
  }

  // Return master DB
  return prisma;
}

// Helper for credentials login
export async function loginWithCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tier: user.tier,
    orgId: user.orgId,
    image: user.image,
  };
}

// Helper to register user with credentials
export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create organization with tenant DB
  let dbUrl: string | undefined;
  let dbAuthToken: string | undefined;

  try {
    const orgSlug = data.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
    const tenantDb = await provisionTenantDb(orgSlug);
    dbUrl = tenantDb.dbUrl;
    dbAuthToken = tenantDb.dbAuthToken;
    await initTenantSchema(dbUrl, dbAuthToken);
  } catch (err) {
    console.error("Failed to provision tenant DB:", err);
  }

  const org = await prisma.organization.create({
    data: {
      name: `${data.name}'s Organization`,
      tier: "FREE",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      ...(dbUrl ? { dbUrl, dbAuthToken } : {}),
    },
  });

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      role: "MANAGER",
      tier: "FREE",
      orgId: org.id,
    },
  });

  // Seed tenant DB
  if (dbUrl && dbAuthToken) {
    try {
      const client = createClient({ url: dbUrl, authToken: dbAuthToken });
      const now = new Date().toISOString();
      
      await client.execute({
        sql: `INSERT INTO "Organization" (id, name, tier, createdAt, updatedAt) VALUES (?, ?, 'FREE', ?, ?)`,
        args: [org.id, org.name, now, now],
      });

      await client.execute({
        sql: `INSERT INTO "User" (id, name, email, role, tier, orgId, createdAt, updatedAt) VALUES (?, ?, ?, 'MANAGER', 'FREE', ?, ?, ?)`,
        args: [user.id, user.name, user.email, org.id, now, now],
      });

      await client.close();
    } catch (err) {
      console.error("Failed to seed tenant DB:", err);
    }
  }

  return user;
}
