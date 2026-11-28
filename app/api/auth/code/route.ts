import { NextResponse } from "next/server";
import { openCode } from "@/lib/server/otp-link";
import { rateLimitByIp } from "@/lib/server/rate-limit";

/** Unseals the token from a code email's link so the page can show the code. */
export async function POST(request: Request) {
  const throttled = rateLimitByIp(request, "auth-code-reveal", 30, 10 * 60_000);
  if (throttled) return throttled;
  const body = (await request.json().catch(() => ({}))) as { token?: unknown };
  const opened = openCode(String(body.token || ""));
  if (!opened) return NextResponse.json({ error: "This link has expired." }, { status: 410 });
  return NextResponse.json(opened, { headers: { "Cache-Control": "no-store" } });
}
