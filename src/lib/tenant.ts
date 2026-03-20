/**
 * Multi-tenant database routing.
 * Each organization has its own Turso database.
 * This module handles provisioning new tenant DBs and returning
 * a Prisma client connected to the correct org's database.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import { prisma as masterPrisma } from "@/lib/prisma";

// Cache tenant Prisma clients and raw libsql clients per org
const clientCache = new Map<string, PrismaClient>();
const rawClientCache = new Map<string, ReturnType<typeof createClient>>();

interface OrgDbCreds {
  dbUrl: string;
  dbAuthToken?: string;
}
const credsCache = new Map<string, OrgDbCreds>();

/**
 * Resolves DB credentials for an org (with caching).
 */
async function getOrgCreds(orgId: string): Promise<OrgDbCreds> {
  if (credsCache.has(orgId)) return credsCache.get(orgId)!;

  const org = await (masterPrisma as any).organization.findUnique({
    where: { id: orgId },
    select: { dbUrl: true, dbAuthToken: true },
  });

  const creds: OrgDbCreds = {
    dbUrl: org?.dbUrl
      ? org.dbUrl.replace("libsql://", "https://")
      : (process.env.DATABASE_URL ?? "").replace("libsql://", "https://"),
    dbAuthToken: org?.dbAuthToken ?? process.env.DATABASE_AUTH_TOKEN?.trim(),
  };

  credsCache.set(orgId, creds);
  return creds;
}

/**
 * Returns a Prisma client for the given org's database.
 * Falls back to master DB if the org has no dedicated DB.
 */
export async function getPrismaForOrg(orgId: string): Promise<PrismaClient> {
  if (clientCache.has(orgId)) return clientCache.get(orgId)!;

  const { dbUrl, dbAuthToken } = await getOrgCreds(orgId);
  const adapter = new PrismaLibSql({ url: dbUrl, authToken: dbAuthToken ?? undefined });
  const client = new PrismaClient({ adapter } as any);

  clientCache.set(orgId, client);
  return client;
}

/**
 * Returns a raw libsql client for the given org's database.
 * Use this in routes that use raw SQL (createClient / getDb pattern).
 */
export async function getTenantDb(orgId: string): Promise<ReturnType<typeof createClient>> {
  if (rawClientCache.has(orgId)) return rawClientCache.get(orgId)!;

  const { dbUrl, dbAuthToken } = await getOrgCreds(orgId);
  const client = createClient({ url: dbUrl, authToken: dbAuthToken ?? undefined });

  rawClientCache.set(orgId, client);
  return client;
}

/**
 * Clears the cached clients for an org (call after provisioning a new DB).
 */
export function clearTenantCache(orgId: string): void {
  clientCache.delete(orgId);
  rawClientCache.delete(orgId);
  credsCache.delete(orgId);
}

/**
 * Provisions a brand-new Turso database for a new organization.
 * Returns { dbUrl, dbAuthToken } to store in the master Organization record.
 */
export async function provisionTenantDb(orgSlug: string): Promise<{ dbUrl: string; dbAuthToken: string }> {
  const apiToken = process.env.TURSO_API_TOKEN;
  const tursoOrg = process.env.TURSO_ORG_SLUG ?? "clockroster";

  if (!apiToken) {
    throw new Error("TURSO_API_TOKEN is not configured");
  }

  // Create a safe database name from the org slug
  const dbName = `wf-${orgSlug.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 32)}-${Date.now().toString(36)}`;

  // 1. Create the database
  const createRes = await fetch(`https://api.turso.tech/v1/organizations/${tursoOrg}/databases`, {
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
    const err = await createRes.text();
    throw new Error(`Failed to create Turso DB: ${err}`);
  }

  const dbData = await createRes.json();
  const hostname = dbData?.database?.Hostname;
  if (!hostname) {
    throw new Error(`Turso DB created but no hostname returned: ${JSON.stringify(dbData)}`);
  }

  const dbUrl = `libsql://${hostname}`;

  // 2. Create an auth token for this database
  const tokenRes = await fetch(
    `https://api.turso.tech/v1/organizations/${tursoOrg}/databases/${dbName}/auth/tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ permissions: { read_attach: { databases: [] } } }),
    }
  );

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Failed to create Turso DB token: ${err}`);
  }

  const tokenData = await tokenRes.json();
  const dbAuthToken = tokenData?.jwt;
  if (!dbAuthToken) {
    throw new Error(`Turso token created but no jwt returned: ${JSON.stringify(tokenData)}`);
  }

  return { dbUrl, dbAuthToken };
}

/**
 * Runs the schema migrations on a freshly provisioned tenant DB.
 * We use raw SQL (from schema) since we can't run `prisma migrate` at runtime.
 */
export async function initTenantSchema(dbUrl: string, dbAuthToken: string): Promise<void> {
  const url = dbUrl.replace("libsql://", "https://");
  const db = createClient({ url, authToken: dbAuthToken });

  const statements = [
    `CREATE TABLE IF NOT EXISTS "Organization" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "tier" TEXT NOT NULL DEFAULT 'FREE',
      "dbUrl" TEXT,
      "dbAuthToken" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
      "tier" TEXT NOT NULL DEFAULT 'FREE',
      "orgId" TEXT,
      "emailVerified" INTEGER DEFAULT 1,
      "username" TEXT,
      "linkedEmployeeId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("orgId") REFERENCES "Organization"("id")
    )`,
    `CREATE TABLE IF NOT EXISTS "Employee" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "employeeId" TEXT NOT NULL UNIQUE,
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
    )`,
    `CREATE TABLE IF NOT EXISTS "TimeEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "clockIn" DATETIME NOT NULL,
      "clockOut" DATETIME,
      "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Schedule" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "orgId" TEXT NOT NULL,
      "weekStart" DATETIME NOT NULL,
      "shifts" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "PayrollEntry" (
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
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Holiday" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "date" DATETIME NOT NULL,
      "name" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "orgId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "read" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Asset" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "assetCode" TEXT NOT NULL UNIQUE,
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
    )`,
    `CREATE TABLE IF NOT EXISTS "AssetAssignment" (
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
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "AssetRequest" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "employeeId" TEXT NOT NULL,
      "assetId" TEXT,
      "assetType" TEXT NOT NULL,
      "reason" TEXT NOT NULL,
      "urgency" TEXT NOT NULL DEFAULT 'Normal',
      "status" TEXT NOT NULL DEFAULT 'Pending',
      "adminComment" TEXT,
      "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("assetId") REFERENCES "Asset"("id")
    )`,
    `CREATE TABLE IF NOT EXISTS "Announcement" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "authorId" TEXT NOT NULL,
      "orgId" TEXT NOT NULL,
      "pinned" INTEGER NOT NULL DEFAULT 0,
      "reactions" TEXT NOT NULL DEFAULT '{}',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "LeaveRequest" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "startDate" DATETIME NOT NULL,
      "endDate" DATETIME NOT NULL,
      "reason" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "approvedBy" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "EmailVerification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL UNIQUE,
      "name" TEXT NOT NULL,
      "companyName" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "expiresAt" TEXT NOT NULL,
      "createdAt" TEXT NOT NULL
    )`,
  ];

  for (const sql of statements) {
    await db.execute(sql);
  }
}
