import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { attemptOtp, claimAdminInvite, findUserByEmail, upsertUser } from "@/lib/server/db";
import { readPreauth, setPreauth } from "@/lib/server/session";
import { isBootstrapAdmin } from "@/lib/roles";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.otp || "").trim();
    const preauth = await readPreauth();
    const user = await findUserByEmail(email);
    if (!user || !preauth || preauth.step !== "otp" || preauth.userId !== user.id) {
      return jsonError("Start verification from your sign-in or sign-up session first.", 401);
    }

    const attempt = await attemptOtp(email, code);
    if (attempt.state === "missing") {
      return jsonError("No verification code found. Request a new one.");
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

    user.emailVerified = true;
    if (isBootstrapAdmin(user.email) && !user.roles?.includes("admin")) {
      user.roles = [...(user.roles || ["personal"]), "admin"];
    }
    // Email is now proven, so a pending admin invite for it can be used.
    await claimAdminInvite(user);
    await upsertUser(user);
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
