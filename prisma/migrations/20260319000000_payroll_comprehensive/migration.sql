-- AlterTable: Add new columns to PayrollEntry
ALTER TABLE "PayrollEntry" ADD COLUMN "periodType" TEXT NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "PayrollEntry" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "PayrollEntry" ADD COLUMN "rateType" TEXT NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "PayrollEntry" ADD COLUMN "rate" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "dailyRate" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "hourlyRate" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "daysWorked" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "hoursWorked" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "lateMinutes" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "undertimeMinutes" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "absenceDays" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "basicPay" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "lateDeduction" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "undertimeDeduction" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "absenceDeduction" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "otPay" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "nightDiffPay" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "holidayPay" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "allowancesJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "PayrollEntry" ADD COLUMN "totalAllowances" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "grossPay" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "sssEmployee" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "sssEmployer" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "philhealthEmployee" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "philhealthEmployer" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "pagibigEmployee" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "pagibigEmployer" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "withholdingTax" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "taxableIncome" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "otherDeductionsJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "PayrollEntry" ADD COLUMN "totalOtherDeductions" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "netPay" REAL NOT NULL DEFAULT 0;
ALTER TABLE "PayrollEntry" ADD COLUMN "notes" TEXT;

-- CreateTable: Holiday
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "orgId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable: Employee (if not exists)
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
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Employee_employeeId_key" ON "Employee"("employeeId");
