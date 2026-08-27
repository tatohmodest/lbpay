import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { findUserById, publicUser } from "@/lib/server/db";
import { pinFailResponse, verifyUserPin } from "@/lib/server/pin";
import { clearPreauth, createSession, readPreauth, readSession, SESSION_TTL_SEC } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const pin = String(body.pin || "");
    if (!/^\d{4}$/.test(pin)) {
      return jsonError("PIN must be 4 digits.");
    }

    const session = await readSession();
    const preauth = await readPreauth();
    const userId = session?.userId || preauth?.userId;
    if (!userId) return jsonError("Sign in first.", 401);

    const user = await findUserById(userId);
    if (!user) return jsonError("Sign in first.", 401);
    const pinCheck = await verifyUserPin(user, pin);
    if (!pinCheck.ok) return pinFailResponse(pinCheck);

    await clearPreauth();
    await createSession(user.id, SESSION_TTL_SEC);
    return NextResponse.json({ ok: true, user: publicUser(user) });
  } catch (error) {
    return catchRoute("pin", error);
  }
}
