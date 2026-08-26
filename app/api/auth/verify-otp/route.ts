import { NextResponse } from "next/server";
import { bumpOtpAttempt, clearOtp, findUserByEmail, takeOtp, upsertUser } from "@/lib/server/db";
import { verifySecret } from "@/lib/server/crypto";
import { setPreauth } from "@/lib/server/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const code = String(body.otp || "").trim();
  const record = await takeOtp(email);
  const user = await findUserByEmail(email);

  if (!record || !user) {
    return NextResponse.json({ error: "No verification code found. Request a new one." }, { status: 400 });
  }
  if (record.exp < Date.now()) {
    await clearOtp(email);
    return NextResponse.json({ error: "That code expired. Request a new one." }, { status: 400 });
  }
  if (record.attempts >= 5) {
    return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
  }

  const ok = await verifySecret(code, record.hash);
  if (!ok) {
    await bumpOtpAttempt(email);
    return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
  }

  user.emailVerified = true;
  await upsertUser(user);
  await clearOtp(email);
  await setPreauth(user.id, user.pinHash ? "pin" : "pin-setup");
  return NextResponse.json({
    ok: true,
    step: user.pinHash ? "pin" : "pin-setup",
    email,
  });
}
