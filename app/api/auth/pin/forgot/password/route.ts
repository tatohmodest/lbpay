import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { findUserById } from "@/lib/server/db";
import { verifyUserPassword } from "@/lib/server/pin";
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
    if (user.status === "frozen") return jsonError("This account is frozen. Contact support.", 403);

    const pwdCheck = await verifyUserPassword(user, password);
    if (!pwdCheck.ok) {
      return jsonError(
        pwdCheck.status === 429 ? pwdCheck.error : "Incorrect password.",
        pwdCheck.status,
      );
    }
    await setPreauth(user.id, "pin-reset-pin");
    return NextResponse.json({ ok: true, step: "pin" });
  } catch (error) {
    return catchRoute("pin-forgot-password", error);
  }
}
