import { NextResponse } from "next/server";
import { adminOtpKey, attemptOtp } from "@/lib/server/db";
import { createAdminSession } from "@/lib/server/session";
import { requireUser } from "@/lib/server/guard";
import { isAdmin } from "@/lib/roles";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error || !auth.user) return auth.error!;
  if (!isAdmin(auth.user)) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const code = String(body.otp || "").trim();
  const key = adminOtpKey(auth.user.email);
  const attempt = await attemptOtp(key, code);
  if (attempt.state === "missing") {
    return NextResponse.json({ error: "Request a new admin code." }, { status: 400 });
  }
  if (attempt.state === "expired") {
    return NextResponse.json({ error: "That code expired. Send a new one." }, { status: 400 });
  }
  if (attempt.state === "locked" || (attempt.state === "wrong" && attempt.left === 0)) {
    return NextResponse.json({ error: "Too many incorrect codes. Send a new one to your email." }, { status: 429 });
  }
  if (attempt.state === "wrong") {
    return NextResponse.json(
      { error: attempt.left === 1 ? "Incorrect code. 1 try left." : `Incorrect code. ${attempt.left} tries left.` },
      { status: 400 },
    );
  }
  await createAdminSession(auth.user.id);
  return NextResponse.json({ ok: true });
}
