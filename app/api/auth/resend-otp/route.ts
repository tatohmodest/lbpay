import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { findUserByEmail, saveOtp } from "@/lib/server/db";
import { hashSecret, randomOtp } from "@/lib/server/crypto";
import { sendOtpEmail } from "@/lib/server/mail";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const user = await findUserByEmail(email);
    if (!user) return jsonError("Account not found.", 404);

    const otp = randomOtp();
    await saveOtp({
      email,
      hash: await hashSecret(otp),
      exp: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    });
    await sendOtpEmail(email, otp, user.name);
    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return catchRoute("resend-otp", error);
  }
}
