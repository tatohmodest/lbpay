import { NextResponse } from "next/server";
import { bumpOtpAttempt, clearOtp, takeOtp } from "@/lib/server/db";
import { verifySecret } from "@/lib/server/crypto";
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
  const record = await takeOtp(`admin:${auth.user.email}`);
  if (!record) {
    return NextResponse.json({ error: "Request a new admin code." }, { status: 400 });
  }
  if (record.exp < Date.now()) {
    await clearOtp(`admin:${auth.user.email}`);
    return NextResponse.json({ error: "That code expired." }, { status: 400 });
  }
  if (record.attempts >= 5) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }
  if (!(await verifySecret(code, record.hash))) {
    await bumpOtpAttempt(`admin:${auth.user.email}`);
    return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
  }
  await clearOtp(`admin:${auth.user.email}`);
  await createAdminSession(auth.user.id);
  return NextResponse.json({ ok: true });
}
