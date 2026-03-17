import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  let dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  // Turso: convert https:// → libsql:// and use ?tls=1 for HTTP fallback
  // @libsql/client supports both libsql:// (ws) and https:// (http)
  // For Vercel serverless we force the HTTP transport by using https://
  if (dbUrl.startsWith("libsql://")) {
    // Replace libsql:// with https:// for HTTP transport (no WebSocket needed)
    dbUrl = dbUrl.replace("libsql://", "https://");
  }

  const adapter = new PrismaLibSql({ url: dbUrl, authToken });
  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
