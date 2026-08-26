import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const header = request.headers.get("authorization") || "";
  const key = header.replace("Bearer ", "").trim();
  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_") && key !== "sk_test_demo") {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  return NextResponse.json({
    object: "balance",
    currency: "XAF",
    available: 125500,
    pending: 0,
  });
}
