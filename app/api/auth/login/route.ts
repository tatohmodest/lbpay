import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/server/db";
import { verifySecret } from "@/lib/server/crypto";
import { setPreauth } from "@/lib/server/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const user = await findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }
  const ok = await verifySecret(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }
  if (!user.emailVerified) {
    await setPreauth(user.id, "otp");
    return NextResponse.json({ ok: true, step: "otp", email: user.email });
  }
  if (!user.pinHash) {
    await setPreauth(user.id, "pin-setup");
    return NextResponse.json({ ok: true, step: "pin-setup", email: user.email });
  }
  await setPreauth(user.id, "pin");
  return NextResponse.json({ ok: true, step: "pin", email: user.email });
}
