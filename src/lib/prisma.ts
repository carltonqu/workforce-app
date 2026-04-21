import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL?.trim();
  
  // If using Turso/libsql with proper URL
  if (dbUrl && (dbUrl.startsWith("libsql://") || dbUrl.startsWith("https://"))) {
    const authToken = process.env.DATABASE_AUTH_TOKEN?.trim();
    const adapter = new PrismaLibSql({ 
      url: dbUrl, 
      authToken 
    });
    return new PrismaClient({ adapter } as any);
  }
  
  // Standard SQLite or fallback
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
