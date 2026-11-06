import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { attemptOtp, findUserByEmail, resetOtpKey } from "@/lib/server/db";
import { setPreauth } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.otp || body.code || "").trim();
    const key = resetOtpKey(email);
    const user = await findUserByEmail(email);
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

    await setPreauth(user.id, "reset");
    return NextResponse.json({ ok: true, step: "reset", email });
  } catch (error) {
    return catchRoute("forgot-verify", error);
  }
}
