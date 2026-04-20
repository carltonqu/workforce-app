import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Stub - account creation disabled without auth system
  return NextResponse.json({ 
    error: "Account creation is currently disabled. Authentication system is being rebuilt." 
  }, { status: 503 });
}
