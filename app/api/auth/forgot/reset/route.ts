import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { findUserById, upsertUser } from "@/lib/server/db";
import { hashSecret } from "@/lib/server/crypto";
import { clearPreauth, readPreauth } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = String(body.password || "");
    const confirm = String(body.confirm || "");

    if (password.length < 6) {
      return jsonError("Password must be at least 6 characters.");
    }
    if (password !== confirm) {
      return jsonError("Passwords do not match.");
    }

    const preauth = await readPreauth();
    if (!preauth || preauth.step !== "reset") {
      return jsonError("Verify the reset code first.", 401);
    }

    const user = await findUserById(preauth.userId);
    if (!user) return jsonError("Account not found.", 404);

    user.passwordHash = await hashSecret(password);
    user.emailVerified = true;
    await upsertUser(user);
    await clearPreauth();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return catchRoute("forgot-reset", error);
  }
}
