import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Role-based route configuration
const routeConfig = {
  // Admin-only routes
  admin: [
    "/dashboard/admin",
    "/employees/new",
    "/employees/edit",
    "/payroll/generate",
    "/finance/admin",
    "/settings/system",
    "/settings/company",
    "/settings/integrations",
  ],
  
  // Supervisor+ routes (MANAGER, HR, SUPERVISOR)
  supervisor: [
    "/dashboard/supervisor",
    "/supervisor-assignments",
    "/leave/approve",
  ],
  
  // Employee-only routes
  employee: [
    "/dashboard/employee",
    "/clock",
    "/my-assets",
    "/my-requests",
    "/my-schedule",
    "/my-payslips",
    "/my-profile",
  ],
  
  // Shared routes (all authenticated users)
  shared: [
    "/dashboard",
    "/settings",
    "/announcements",
    "/notifications",
  ],
};

// Helper to check if user has required role
function hasRequiredRole(userRole: string | undefined, requiredRoles: string[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

// Helper to get redirect path based on role
function getRedirectPath(role: string | undefined): string {
  if (!role) return "/login";
  
  switch (role) {
    case "MANAGER":
    case "HR":
      return "/dashboard/admin";
    case "SUPERVISOR":
      return "/dashboard/supervisor";
    case "EMPLOYEE":
      return "/dashboard/employee";
    default:
      return "/dashboard";
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get user session from cookie (JWT token)
  const token = request.cookies.get("next-auth.session-token")?.value ||
                request.cookies.get("__Secure-next-auth.session-token")?.value;
  
  // Check if user is authenticated by looking for auth cookie
  const isAuthenticated = !!token;
  
  // Get user role from custom header (set by NextAuth session)
  // In a real implementation, you'd decode the JWT or use a session callback
  // For now, we'll use a simpler approach with redirects
  
  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register", "/api/auth", "/_next", "/favicon.ico"];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Note: For detailed role-based access control, we need to decode the JWT
  // or have the role available in a cookie/header. Since NextAuth stores
  // the session in an encrypted JWT, we can't easily access the role here.
  
  // Instead, we'll let the page components handle role-based redirects
  // The middleware ensures authentication, pages handle authorization
  
  // However, we can add some basic path-based redirects for known patterns
  
  // Redirect /dashboard to role-specific dashboard
  if (pathname === "/dashboard") {
    // We'll let the dashboard page handle this redirect
    return NextResponse.next();
  }
  
  // API routes are handled separately
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

// Configure middleware matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
