import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createClient } from "@libsql/client";

function getDb() {
  return createClient({
    url: (process.env.DATABASE_URL ?? "").replace("libsql://", "https://"),
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
}

async function ensureAuthColumns(db: ReturnType<typeof getDb>) {
  // Safe no-op when columns already exist
  try { await db.execute("ALTER TABLE User ADD COLUMN username TEXT"); } catch {}
  try { await db.execute("ALTER TABLE User ADD COLUMN emailVerified INTEGER DEFAULT 1"); } catch {}
}

const providers = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Username or Email", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const input = (credentials.email as string).trim().toLowerCase();
      let user = null;

      // Try email first
      user = await prisma.user.findUnique({ where: { email: input } });

      // If not found by email, try username via raw query
      if (!user) {
        const db = getDb();
        await ensureAuthColumns(db);
        const rows = await db.execute({
          sql: "SELECT id FROM User WHERE LOWER(username)=?",
          args: [input],
        });
        if (rows.rows.length) {
          const userId = rows.rows[0].id as string;
          user = await prisma.user.findUnique({ where: { id: userId } });
        }
      }

      if (!user) return null;

      const passwordMatch = await bcrypt.compare(
        credentials.password as string,
        user.password
      );
      if (!passwordMatch) return null;

      // Require email verification for newly registered email/password admins
      // (legacy users without column/default remain allowed)
      try {
        const db = getDb();
        await ensureAuthColumns(db);
        const row = await db.execute({
          sql: "SELECT emailVerified FROM User WHERE id=? LIMIT 1",
          args: [user.id],
        });
        const emailVerified = Number(row.rows[0]?.emailVerified ?? 1);
        if (!emailVerified) return null;
      } catch {
        // If check fails, do not block legacy flows
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tier: user.tier,
        orgId: user.orgId,
      };
    },
  }),
] as any[];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers,
  callbacks: {
    async signIn({ user, account }) {
      // For Google sign-in, create user + org if first login
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({ where: { email: user.email } });
        if (!existing) {
          const org = await prisma.organization.create({
            data: {
              name: `${user.name || "Admin"}'s Organization`,
              tier: "ADVANCED",
            },
          });
          const randomPw = await bcrypt.hash(`google:${crypto.randomUUID()}`, 10);
          const created = await prisma.user.create({
            data: {
              name: user.name || "Admin",
              email: user.email,
              password: randomPw,
              role: "MANAGER",
              tier: "ADVANCED",
              orgId: org.id,
            },
          });
          try {
            const db = getDb();
            await ensureAuthColumns(db);
            await db.execute({
              sql: "UPDATE User SET emailVerified=1 WHERE id=?",
              args: [created.id],
            });
          } catch {}
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Credentials flow
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.tier = (user as any).tier;
        token.orgId = (user as any).orgId;
      }

      // Google flow: enrich token from DB
      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.tier = dbUser.tier;
          token.orgId = dbUser.orgId;
        }
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
  },
  session: {
    strategy: "jwt",
  },
});
