import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // Check if we're in build/SSG mode (no env vars available)
  if (typeof process === 'undefined' || !process.env.DATABASE_URL) {
    // Return a dummy client for build time
    return new PrismaClient({
      datasources: {
        db: {
          url: "file:./dev.db"
        }
      }
    });
  }

  const dbUrl = process.env.DATABASE_URL.trim();
  
  // If using Turso/libsql
  if (dbUrl.startsWith("libsql://") || dbUrl.startsWith("https://")) {
    const authToken = process.env.DATABASE_AUTH_TOKEN?.trim();
    try {
      const adapter = new PrismaLibSql({ 
        url: dbUrl, 
        authToken 
      });
      return new PrismaClient({ adapter } as any);
    } catch (error) {
      console.error("Failed to create PrismaLibSql adapter:", error);
      // Fallback to standard client
      return new PrismaClient();
    }
  }
  
  // Standard SQLite
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
