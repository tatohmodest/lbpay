import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { publicUser, upsertUser } from "@/lib/server/db";
import { requireActiveUser } from "@/lib/server/guard";

export async function PATCH(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (auth.error || !auth.user) return auth.error!;
    const body: unknown = await request.json().catch(() => ({}));
    const value = body && typeof body === "object" ? (body as { name?: unknown }).name : undefined;
    if (typeof value !== "string") return jsonError("Enter a valid name.");
    const name = value.trim();
    if (name.length < 2) return jsonError("Your name needs at least 2 characters.");
    if (name.length > 80) return jsonError("Keep your name to 80 characters or fewer.");
    if (/[\u0000-\u001f\u007f]/.test(name)) return jsonError("Your name contains characters that cannot be used.");

    auth.user.name = name;
    await upsertUser(auth.user);
    return NextResponse.json({ ok: true, user: publicUser(auth.user) });
  } catch (error) {
    return catchRoute("profile-update", error);
  }
}
