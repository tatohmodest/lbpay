import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { changeHandle, publicUser } from "@/lib/server/db";
import { requireActiveUser } from "@/lib/server/guard";
import { HANDLE_MAX, HANDLE_MIN, cleanHandleInput } from "@/lib/handle";

/** PATCH /api/me/handle { handle } — move to a new, shorter LBPay ID. */
export async function PATCH(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (auth.error || !auth.user) return auth.error!;
    const body = (await request.json().catch(() => ({}))) as { handle?: string };
    const raw = String(body.handle || "");
    const next = cleanHandleInput(raw);
    if (next.length < HANDLE_MIN) return jsonError(`Your LBPay ID needs at least ${HANDLE_MIN} characters.`);
    if (raw.replace(/^@/, "").length > HANDLE_MAX + 5) return jsonError(`Keep it to ${HANDLE_MAX} characters or fewer.`);
    try {
      const user = await changeHandle(auth.user.id, next);
      return NextResponse.json({ ok: true, user: publicUser(user) });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/taken|different|again in|not found/i.test(message)) return jsonError(message, 409);
      throw err;
    }
  } catch (error) {
    return catchRoute("handle-change", error);
  }
}
