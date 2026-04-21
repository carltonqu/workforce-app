import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  // Build the NextAuth Google signin URL with callbackUrl
  const authUrl = new URL("/api/auth/signin/google", req.url);
  authUrl.searchParams.set("callbackUrl", callbackUrl);
  
  return NextResponse.redirect(authUrl);
}
