import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { findUserByEmail, saveOtp } from "@/lib/server/db";
import { hashSecret, randomOtp } from "@/lib/server/crypto";
import { sendOtpEmail } from "@/lib/server/mail";
import { applyPreauthCookie } from "@/lib/server/session";
import { localeFromRequest } from "@/lib/i18n/locale";
import { verifyUserPassword } from "@/lib/server/pin";
import { rateLimitByIp } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  try {
    const throttled = rateLimitByIp(request, "auth-login", 25, 5 * 60_000);
    if (throttled) return throttled;

    const locale = localeFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const user = await findUserByEmail(email);
    if (!user) {
      return jsonError("Incorrect email or password.", 401);
    }
    const pwdCheck = await verifyUserPassword(user, password);
    if (!pwdCheck.ok) {
      return jsonError(pwdCheck.error, pwdCheck.status);
    }
    if (user.status === "frozen") {
      return jsonError("This account is frozen. Contact support.", 403);
    }
    if (!user.emailVerified) {
      const otp = randomOtp();
      await saveOtp({
        email: user.email,
        hash: await hashSecret(otp),
        exp: Date.now() + 10 * 60 * 1000,
        attempts: 0,
      });
      await sendOtpEmail(user.email, otp, user.name, "verify", locale);
      const response = NextResponse.json({
        ok: true,
        step: "otp",
        email: user.email,
      });
      applyPreauthCookie(response, user.id, "otp");
      return response;
    }
    if (!user.pinHash) {
      const response = NextResponse.json({ ok: true, step: "pin-setup", email: user.email });
      applyPreauthCookie(response, user.id, "pin-setup");
      return response;
    }
    const response = NextResponse.json({ ok: true, step: "pin", email: user.email });
    applyPreauthCookie(response, user.id, "pin");
    return response;
  } catch (error) {
    return catchRoute("login", error);
  }
}
