import { NextResponse } from "next/server";
import { catchRoute } from "@/lib/server/api";
import { hashSecret, randomOtp } from "@/lib/server/crypto";
import { sendOtpEmail } from "@/lib/server/mail";
import { adminOtpKey, saveOtp, takeOtp } from "@/lib/server/db";
import { requireUser } from "@/lib/server/guard";
import { isAdmin } from "@/lib/roles";

const ADMIN_OTP_MS = 10 * 60 * 1000;
const RESEND_MS = 60 * 1000;

export async function POST() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;
    if (!isAdmin(auth.user)) {
      return NextResponse.json({ error: "Admin only." }, { status: 403 });
    }

    const key = adminOtpKey(auth.user.email);
    const existing = await takeOtp(key);
    if (existing && existing.exp > Date.now() + ADMIN_OTP_MS - RESEND_MS) {
      return NextResponse.json({
        ok: true,
        reused: true,
        message: "We already sent a code. Check the admin email inbox.",
      });
    }

    const otp = randomOtp();
    await saveOtp({
      email: key,
      hash: await hashSecret(otp),
      exp: Date.now() + ADMIN_OTP_MS,
      attempts: 0,
    });
    await sendOtpEmail(auth.user.email, otp, auth.user.name, "admin");
    return NextResponse.json({ ok: true, message: "We sent a 6-digit code to your email." });
  } catch (error) {
    return catchRoute("admin-otp-request", error);
  }
}
