import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { findUserById, publicUser, upsertUser } from "@/lib/server/db";
import { hashSecret } from "@/lib/server/crypto";
import { clearPreauth, createSession, readPreauth, readSession, SESSION_TTL_SEC } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const pin = String(body.pin || "");
    const confirm = String(body.confirm || pin);
    if (!/^\d{4}$/.test(pin)) {
      return jsonError("PIN must be 4 digits.");
    }
    if (pin !== confirm) {
      return jsonError("PINs do not match.");
    }

    const preauth = await readPreauth();
    if (!preauth || preauth.step !== "pin-reset-pin") {
      return jsonError("Confirm your password first.", 401);
    }
    const user = await findUserById(preauth.userId);
    if (!user) return jsonError("Account not found.", 404);

    user.pinHash = await hashSecret(pin);
    user.pinFailCount = 0;
    user.pinLockedUntil = 0;
    await upsertUser(user);
    await clearPreauth();

    const session = await readSession();
    if (session?.userId === user.id) {
      await createSession(user.id, SESSION_TTL_SEC);
    }

    return NextResponse.json({ ok: true, user: publicUser(user) });
  } catch (error) {
    return catchRoute("pin-forgot-reset", error);
  }
}
