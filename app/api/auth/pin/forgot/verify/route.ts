import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { attemptOtp, findUserByEmail, findUserById, pinResetOtpKey } from "@/lib/server/db";
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
    const attempt = user ? await attemptOtp(key, code) : { state: "missing" as const };
    if (attempt.state === "missing" || !user) {
      return jsonError("No reset code found. Request a new one.");
    }
    if (attempt.state === "expired") {
      return jsonError("That code expired. Request a new one.");
    }
    if (attempt.state === "locked") {
      return jsonError("Too many attempts. Request a new code.", 429);
    }
    if (attempt.state === "wrong") {
      return jsonError("Incorrect code.");
    }

    await setPreauth(user.id, "pin-reset");
    return NextResponse.json({ ok: true, step: "password", email: user.email });
  } catch (error) {
    return catchRoute("pin-forgot-verify", error);
  }
}
