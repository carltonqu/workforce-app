import "dotenv/config";
import { defineConfig } from "prisma/config";

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

// Build a url with auth token embedded for prisma migrate compatibility
const migrateUrl = authToken
  ? dbUrl
  : dbUrl;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrateUrl,
  },
});
