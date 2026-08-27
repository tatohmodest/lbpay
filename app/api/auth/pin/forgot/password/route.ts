import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { findUserById } from "@/lib/server/db";
import { verifySecret } from "@/lib/server/crypto";
import { readPreauth, setPreauth } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = String(body.password || "");
    const preauth = await readPreauth();
    if (!preauth || preauth.step !== "pin-reset") {
      return jsonError("Verify the code first.", 401);
    }
    const user = await findUserById(preauth.userId);
    if (!user) return jsonError("Account not found.", 404);
    const ok = await verifySecret(password, user.passwordHash);
    if (!ok) return jsonError("Incorrect password.");
    await setPreauth(user.id, "pin-reset-pin");
    return NextResponse.json({ ok: true, step: "pin" });
  } catch (error) {
    return catchRoute("pin-forgot-password", error);
  }
}
