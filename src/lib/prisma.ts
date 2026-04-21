import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // During build/SSG, return a dummy client that won't be used
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_PHASE === 'phase-export') {
    return {} as PrismaClient;
  }

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
  
  // For local SQLite - Prisma 7 requires the libsql adapter
  // Create a local file-based adapter
  const adapter = new PrismaLibSql({ 
    url: dbUrl || "file:./dev.db"
  });
  return new PrismaClient({ adapter } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
