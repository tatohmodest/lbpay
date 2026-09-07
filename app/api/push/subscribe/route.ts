import { NextResponse } from "next/server";
import { catchRoute, jsonError } from "@/lib/server/api";
import { deletePushSubscription, savePushSubscription } from "@/lib/server/db";
import { requireUser } from "@/lib/server/guard";

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;
    const body = await request.json().catch(() => ({}));
    const kind = body.kind === "fcm" ? "fcm" : "web";
    const token = String(body.token || "");
    const endpoint = String(body.endpoint || (kind === "fcm" && token ? `fcm:${token}` : ""));
    const p256dh = String(body.keys?.p256dh || body.p256dh || (kind === "fcm" ? "fcm" : ""));
    const authKey = String(body.keys?.auth || body.auth || (kind === "fcm" ? "fcm" : ""));
    if (kind === "fcm" ? !token : !endpoint || !p256dh || !authKey) {
      return jsonError("A valid push subscription is required.");
    }
    await savePushSubscription({
      userId: auth.user.id,
      endpoint: kind === "fcm" ? `fcm:${token}` : endpoint,
      p256dh,
      auth: authKey,
      createdAt: new Date().toISOString(),
      kind,
      token: kind === "fcm" ? token : undefined,
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
