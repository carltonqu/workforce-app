import { createClient } from "@libsql/client";

const db = createClient({
  url: "https://clockroster-clockroster.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM3MzcwNDAsImlkIjoiMDE5Y2ZhZjYtZTkwMS03MzhhLTgxMTEtYzQyNmI2NDJmNDAxIiwicmlkIjoiYThmMjg3NmItNmU5MC00MjYyLWFmNzctOTg0NWU4ZDdlODRhIn0.zhvAe951oDBiMF_N2z-6iCnF7oCkyXPPVOoAVRj3k6CYp0WqfcLpbU0vyJFZK1GCunUcojO3jEoyjzgB_EOGBQ",
});

await db.execute(`
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
console.log("Holiday table created!");

// Also add periodType if missing
try {
  await db.execute(`ALTER TABLE "PayrollEntry" ADD COLUMN "periodType" TEXT NOT NULL DEFAULT 'MONTHLY'`);
  console.log("Added periodType");
} catch(e) {
  console.log("periodType already exists:", e.message);
}

process.exit(0);
