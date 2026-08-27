import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { bumpOtpAttempt, clearOtp, findUserByEmail, resetOtpKey, takeOtp } from "@/lib/server/db";
import { verifySecret } from "@/lib/server/crypto";
import { setPreauth } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.otp || body.code || "").trim();
    const key = resetOtpKey(email);
    const record = await takeOtp(key);
    const user = await findUserByEmail(email);

    if (!record || !user) {
      return jsonError("No reset code found. Request a new one.");
    }
    if (record.exp < Date.now()) {
      await clearOtp(key);
      return jsonError("That code expired. Request a new one.");
    }
    if (record.attempts >= 5) {
      return jsonError("Too many attempts. Request a new code.", 429);
    }

    const ok = await verifySecret(code, record.hash);
    if (!ok) {
      await bumpOtpAttempt(key);
      return jsonError("Incorrect code.");
    }

    await clearOtp(key);
    await setPreauth(user.id, "reset");
    return NextResponse.json({ ok: true, step: "reset", email });
  } catch (error) {
    return catchRoute("forgot-verify", error);
  }
}
