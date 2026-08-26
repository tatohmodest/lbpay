import { NextResponse } from "next/server";
import { findUserById, publicUser, upsertUser } from "@/lib/server/db";
import { hashSecret } from "@/lib/server/crypto";
import { clearPreauth, createSession, readPreauth } from "@/lib/server/session";

const WEB_IDLE_SEC = 20 * 60;
const MOBILE_SEC = 30 * 24 * 60 * 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const pin = String(body.pin || "");
  const confirm = String(body.confirm || pin);
  const mobile = Boolean(body.mobile);
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 4 digits." }, { status: 400 });
  }
  if (pin !== confirm) {
    return NextResponse.json({ error: "PINs do not match." }, { status: 400 });
  }

  const preauth = await readPreauth();
  if (!preauth || preauth.step !== "pin-setup") {
    return NextResponse.json({ error: "Verify your email first." }, { status: 401 });
  }
  const user = await findUserById(preauth.userId);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  user.pinHash = await hashSecret(pin);
  await upsertUser(user);
  await clearPreauth();
  await createSession(user.id, mobile ? MOBILE_SEC : WEB_IDLE_SEC);
  return NextResponse.json({ ok: true, user: publicUser(user) });
}
