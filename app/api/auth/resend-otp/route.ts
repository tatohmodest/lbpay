import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { findUserById, saveOtp } from "@/lib/server/db";
import { hashSecret, randomOtp } from "@/lib/server/crypto";
import { sendOtpEmail } from "@/lib/server/mail";
import { readPreauth } from "@/lib/server/session";
import { rateLimitByIp } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  try {
    const throttled = rateLimitByIp(request, "auth-resend-otp", 10, 10 * 60_000);
    if (throttled) return throttled;

    const preauth = await readPreauth();
    if (!preauth || preauth.step !== "otp") {
      return jsonError("Start verification from sign-in or sign-up first.", 401);
    }
    const user = await findUserById(preauth.userId);
    if (!user) return jsonError("Session expired. Sign in again.", 401);

    const otp = randomOtp();
    await saveOtp({
      email: user.email,
      hash: await hashSecret(otp),
      exp: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    });
    await sendOtpEmail(user.email, otp, user.name);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return catchRoute("resend-otp", error);
  }
}
