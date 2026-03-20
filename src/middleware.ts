import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/", "/login", "/signup"];

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  // NextAuth v5 uses __Secure-authjs.session-token on HTTPS
  // and authjs.session-token on HTTP — try both
  const token =
    (await getToken({
      req,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
      cookieName: "__Secure-authjs.session-token",
    })) ??
    (await getToken({
      req,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
      cookieName: "authjs.session-token",
    }));

  const isLoggedIn = !!token;
  const isPublicPath = publicPaths.includes(nextUrl.pathname);

  if (!isLoggedIn && !isPublicPath) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("redirect", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && nextUrl.pathname === "/login") {
    const redirect = nextUrl.searchParams.get("redirect") || "/dashboard";
    return NextResponse.redirect(new URL(redirect, nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
