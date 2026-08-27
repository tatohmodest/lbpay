import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import {
  bumpOtpAttempt,
  clearOtp,
  findUserByEmail,
  findUserById,
  pinResetOtpKey,
  takeOtp,
} from "@/lib/server/db";
import { verifySecret } from "@/lib/server/crypto";
import { readPreauth, readSession, setPreauth } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const code = String(body.otp || body.code || "").trim();
    const session = await readSession();
    const preauth = await readPreauth();
    const userId = session?.userId || preauth?.userId;
    const email = String(body.email || "").trim().toLowerCase();
    const user = userId ? await findUserById(userId) : email ? await findUserByEmail(email) : null;
    const key = pinResetOtpKey(user?.email || email);
    const record = await takeOtp(key);

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
    await setPreauth(user.id, "pin-reset");
    return NextResponse.json({ ok: true, step: "password", email: user.email });
  } catch (error) {
    return catchRoute("pin-forgot-verify", error);
  }
}
