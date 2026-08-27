import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { bumpOtpAttempt, clearOtp, findUserByEmail, takeOtp, upsertUser } from "@/lib/server/db";
import { verifySecret } from "@/lib/server/crypto";
import { setPreauth } from "@/lib/server/session";
import { isBootstrapAdmin } from "@/lib/roles";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.otp || "").trim();
    const record = await takeOtp(email);
    const user = await findUserByEmail(email);

    if (!record || !user) {
      return jsonError("No verification code found. Request a new one.");
    }
    if (record.exp < Date.now()) {
      await clearOtp(email);
      return jsonError("That code expired. Request a new one.");
    }
    if (record.attempts >= 5) {
      return jsonError("Too many attempts. Request a new code.", 429);
    }

    const ok = await verifySecret(code, record.hash);
    if (!ok) {
      await bumpOtpAttempt(email);
      return jsonError("Incorrect code.");
    }

    user.emailVerified = true;
    if (isBootstrapAdmin(user.email) && !user.roles?.includes("admin")) {
      user.roles = [...(user.roles || ["personal"]), "admin"];
    }
    await upsertUser(user);
    await clearOtp(email);
    await setPreauth(user.id, user.pinHash ? "pin" : "pin-setup");
    return NextResponse.json({
      ok: true,
      step: user.pinHash ? "pin" : "pin-setup",
      email,
    });
  } catch (error) {
    return catchRoute("verify-otp", error);
  }
}
