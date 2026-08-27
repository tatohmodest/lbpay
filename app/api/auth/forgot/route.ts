import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { findUserByEmail, resetOtpKey, saveOtp } from "@/lib/server/db";
import { hashSecret, randomOtp } from "@/lib/server/crypto";
import { sendOtpEmail } from "@/lib/server/mail";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return jsonError("Enter a valid email address.");
    }

    const user = await findUserByEmail(email);
    if (user) {
      const otp = randomOtp();
      await saveOtp({
        email: resetOtpKey(email),
        hash: await hashSecret(otp),
        exp: Date.now() + 10 * 60 * 1000,
        attempts: 0,
      });
      await sendOtpEmail(user.email, otp, user.name, "reset");
    }

    return NextResponse.json({
      ok: true,
      email,
      message: "If an account exists for that email, we sent a 6-digit code.",
    });
  } catch (error) {
    return catchRoute("forgot", error);
  }
}
