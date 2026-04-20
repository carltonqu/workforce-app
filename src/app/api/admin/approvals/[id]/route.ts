import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Stub - approvals disabled without auth system
  return NextResponse.json({ 
    error: "Approvals are currently disabled. Authentication system is being rebuilt." 
  }, { status: 503 });
}
