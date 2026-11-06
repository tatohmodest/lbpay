import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { findUserByEmail, saveOtp, upsertUser } from "@/lib/server/db";
import { hashSecret, randomOtp, verifySecret } from "@/lib/server/crypto";
import { sendOtpEmail } from "@/lib/server/mail";
import { applyPreauthCookie } from "@/lib/server/session";
import { localeFromRequest } from "@/lib/i18n/locale";
import { pinLockSeconds, waitCopy } from "@/lib/server/pin";

const LOGIN_MAX_FAILS = 10;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const locale = localeFromRequest(request);
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const user = await findUserByEmail(email);
    if (!user) {
      return jsonError("Incorrect email or password.", 401);
    }
    if ((user.loginLockedUntil || 0) > Date.now()) {
      return jsonError(`Too many incorrect passwords. Try again in ${waitCopy(pinLockSeconds(user.loginLockedUntil!))}, or reset your password.`, 429);
    }
    const ok = await verifySecret(password, user.passwordHash);
    if (!ok) {
      // Ten wrong passwords lock sign-in for 15 minutes, so passwords can't be guessed at speed.
      const fails = (user.loginFailCount || 0) + 1;
      user.loginFailCount = fails >= LOGIN_MAX_FAILS ? 0 : fails;
      if (fails >= LOGIN_MAX_FAILS) user.loginLockedUntil = Date.now() + LOGIN_LOCK_MS;
      await upsertUser(user);
      return jsonError("Incorrect email or password.", 401);
    }
    if (user.loginFailCount || user.loginLockedUntil) {
      user.loginFailCount = 0;
      user.loginLockedUntil = 0;
      await upsertUser(user);
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
