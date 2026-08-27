import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { deletePushSubscription, savePushSubscription } from "@/lib/server/db";
import { requireUser } from "@/lib/server/guard";

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;
    const body = await request.json().catch(() => ({}));
    const endpoint = String(body.endpoint || "");
    const p256dh = String(body.keys?.p256dh || body.p256dh || "");
    const authKey = String(body.keys?.auth || body.auth || "");
    if (!endpoint || !p256dh || !authKey) {
      return jsonError("A valid push subscription is required.");
    }
    await savePushSubscription({
      userId: auth.user.id,
      endpoint,
      p256dh,
      auth: authKey,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return catchRoute("push-subscribe", error);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;
    const body = await request.json().catch(() => ({}));
    const endpoint = String(body.endpoint || "");
    await deletePushSubscription(auth.user.id, endpoint || undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return catchRoute("push-unsubscribe", error);
  }
}
