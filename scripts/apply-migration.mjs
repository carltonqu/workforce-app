import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = createClient({
  url: process.env.DATABASE_URL.replace("libsql://", "https://"),
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const sql = readFileSync(
  join(__dirname, "../prisma/migrations/20260319000000_payroll_comprehensive/migration.sql"),
  "utf-8"
);

// Split on semicolons and execute each statement
const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

for (const stmt of statements) {
  try {
    await db.execute(stmt);
    console.log("✓ Executed:", stmt.slice(0, 60).replace(/\n/g, " ") + "...");
  } catch (err) {
    if (err.message?.includes("duplicate column") || err.message?.includes("already exists")) {
      console.log("⚠ Skipped (already exists):", stmt.slice(0, 60).replace(/\n/g, " "));
    } else {
      console.error("✗ Error:", err.message, "\n  Statement:", stmt.slice(0, 80));
    }
  }
}

console.log("Migration complete!");
process.exit(0);
