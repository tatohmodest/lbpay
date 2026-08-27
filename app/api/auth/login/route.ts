import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { findUserByEmail, saveOtp } from "@/lib/server/db";
import { hashSecret, randomOtp, verifySecret } from "@/lib/server/crypto";
import { sendOtpEmail } from "@/lib/server/mail";
import { setPreauth } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const user = await findUserByEmail(email);
    if (!user) {
      return jsonError("Incorrect email or password.", 401);
    }
    const ok = await verifySecret(password, user.passwordHash);
    if (!ok) {
      return jsonError("Incorrect email or password.", 401);
    }
    if (!user.emailVerified) {
      const otp = randomOtp();
      await saveOtp({
        email: user.email,
        hash: await hashSecret(otp),
        exp: Date.now() + 10 * 60 * 1000,
        attempts: 0,
      });
      const mail = await sendOtpEmail(user.email, otp, user.name);
      await setPreauth(user.id, "otp");
      return NextResponse.json({
        ok: true,
        step: "otp",
        email: user.email,
        delivered: mail.delivered,
        devOtp: mail.delivered ? undefined : otp,
      });
    }
    if (!user.pinHash) {
      await setPreauth(user.id, "pin-setup");
      return NextResponse.json({ ok: true, step: "pin-setup", email: user.email });
    }
    await setPreauth(user.id, "pin");
    return NextResponse.json({ ok: true, step: "pin", email: user.email });
  } catch (error) {
    return catchRoute("login", error);
  }
}
