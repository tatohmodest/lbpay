import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { findUserByEmail, findUserById, pinResetOtpKey, saveOtp } from "@/lib/server/db";
import { hashSecret, randomOtp } from "@/lib/server/crypto";
import { sendOtpEmail } from "@/lib/server/mail";
import { readPreauth, readSession } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const session = await readSession();
    const preauth = await readPreauth();
    const userId = session?.userId || preauth?.userId;
    const email = String(body.email || "").trim().toLowerCase();
    const user = userId ? await findUserById(userId) : email ? await findUserByEmail(email) : null;

    if (user) {
      const otp = randomOtp();
      await saveOtp({
        email: pinResetOtpKey(user.email),
        hash: await hashSecret(otp),
        exp: Date.now() + 10 * 60 * 1000,
        attempts: 0,
      });
      await sendOtpEmail(user.email, otp, user.name, "pin");
    } else if (!email && !userId) {
      return jsonError("Enter the email on your account.");
    }

    return NextResponse.json({
      ok: true,
      email: user?.email || email,
      message: "If this account exists, we sent a 6-digit code.",
    });
  } catch (error) {
    return catchRoute("pin-forgot", error);
  }
}
