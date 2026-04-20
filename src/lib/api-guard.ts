// API Guard stub - no authentication required
// This file exists to prevent import errors while auth is being removed

import { NextRequest, NextResponse } from "next/server";

export function requireAuth() {
  return {
    user: {
      id: "admin",
      name: "Admin User",
      email: "admin@workforce.com",
      role: "MANAGER",
      tier: "ADVANCED",
      orgId: "default-org",
    },
  };
}

export function requireAdmin() {
  return {
    user: {
      id: "admin",
      name: "Admin User",
      email: "admin@workforce.com",
      role: "MANAGER",
      tier: "ADVANCED",
      orgId: "default-org",
    },
  };
}

export function requireFeature(_feature: string) {
  return null;
}

export function withAuth(handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]) => {
    return handler(req, ...args);
  };
}
