import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { findUserById, publicUser } from "@/lib/server/db";
import { verifySecret } from "@/lib/server/crypto";
import { clearPreauth, createSession, readPreauth, readSession } from "@/lib/server/session";

const WEB_IDLE_SEC = 20 * 60;
const MOBILE_SEC = 30 * 24 * 60 * 60;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const pin = String(body.pin || "");
    const mobile = Boolean(body.mobile);
    if (!/^\d{4}$/.test(pin)) {
      return jsonError("PIN must be 4 digits.");
    }

    const session = await readSession();
    const preauth = await readPreauth();
    const userId = session?.userId || preauth?.userId;
    if (!userId) return jsonError("Sign in first.", 401);

    const user = await findUserById(userId);
    if (!user?.pinHash) {
      return jsonError("Set a PIN first.");
    }
    const ok = await verifySecret(pin, user.pinHash);
    if (!ok) return jsonError("Incorrect PIN.", 401);

    if (!session) {
      await clearPreauth();
      await createSession(user.id, mobile ? MOBILE_SEC : WEB_IDLE_SEC);
    }
    return NextResponse.json({ ok: true, user: publicUser(user) });
  } catch (error) {
    return catchRoute("pin", error);
  }
}
