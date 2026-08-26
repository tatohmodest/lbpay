import { NextResponse } from "next/server";
import { findUserById, publicUser } from "@/lib/server/db";
import { verifySecret } from "@/lib/server/crypto";
import { clearPreauth, createSession, readPreauth, readSession } from "@/lib/server/session";

const WEB_IDLE_SEC = 20 * 60;
const MOBILE_SEC = 30 * 24 * 60 * 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const pin = String(body.pin || "");
  const mobile = Boolean(body.mobile);
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 4 digits." }, { status: 400 });
  }

  const session = await readSession();
  const preauth = await readPreauth();
  const userId = session?.userId || preauth?.userId;
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const user = await findUserById(userId);
  if (!user?.pinHash) {
    return NextResponse.json({ error: "Set a PIN first." }, { status: 400 });
  }
  const ok = await verifySecret(pin, user.pinHash);
  if (!ok) return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });

  if (!session) {
    await clearPreauth();
    await createSession(user.id, mobile ? MOBILE_SEC : WEB_IDLE_SEC);
  }
  return NextResponse.json({ ok: true, user: publicUser(user) });
}
