import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rawUrl = process.env.DATABASE_URL ?? "NOT_SET";
    const authToken = process.env.DATABASE_AUTH_TOKEN;

    let dbUrl = rawUrl;
    if (dbUrl.startsWith("libsql://")) {
      dbUrl = dbUrl.replace("libsql://", "https://");
    }

    return NextResponse.json({
      raw_url: rawUrl,
      converted_url: dbUrl,
      has_token: !!authToken,
      token_prefix: authToken?.substring(0, 20),
      node_env: process.env.NODE_ENV,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
