import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  try {
    // Redirect to Google OAuth via NextAuth
    await signIn("google", { 
      redirectTo: callbackUrl,
    });
  } catch (error) {
    // signIn throws on redirect, which is expected
    if ((error as Error).message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Google signin error:", error);
    return NextResponse.redirect(new URL("/login?error=OAuthSignin", req.url));
  }
}
