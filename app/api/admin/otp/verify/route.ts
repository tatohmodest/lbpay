import { NextResponse } from "next/server";
import { adminOtpKey, bumpOtpAttempt, clearOtp, takeOtp } from "@/lib/server/db";
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
  const key = adminOtpKey(auth.user.email);
  const record = await takeOtp(key);
  if (!record) {
    return NextResponse.json({ error: "Request a new admin code." }, { status: 400 });
  }
  if (record.exp < Date.now()) {
    await clearOtp(key);
    return NextResponse.json({ error: "That code expired. Send a new one." }, { status: 400 });
  }
  if (record.attempts >= 5) {
    await clearOtp(key);
    return NextResponse.json(
      { error: "Too many incorrect codes. Send a new one to your email." },
      { status: 429 },
    );
  }
  if (!(await verifySecret(code, record.hash))) {
    const updated = await bumpOtpAttempt(key);
    const left = Math.max(0, 5 - (updated?.attempts || 0));
    if (left === 0) await clearOtp(key);
    return NextResponse.json(
      {
        error:
          left === 0
            ? "Too many incorrect codes. Send a new one to your email."
            : left === 1
              ? "Incorrect code. 1 try left."
              : `Incorrect code. ${left} tries left.`,
      },
      { status: left === 0 ? 429 : 400 },
    );
  }
  await clearOtp(key);
  await createAdminSession(auth.user.id);
  return NextResponse.json({ ok: true });
}
