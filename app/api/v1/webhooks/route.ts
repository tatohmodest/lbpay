import { NextResponse } from "next/server";
import { authenticateApiKey, logApi } from "@/lib/server/apikey";
import { addWebhook, deleteWebhook, listWebhooks } from "@/lib/server/db";
import { normalizeWebhookEvents, validateWebhookUrl } from "@/lib/server/webhooks";
import { uid } from "@/lib/format";

export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.error;
  const hooks = await listWebhooks(auth.user.id);
  await logApi(auth.user.id, "GET", "/v1/webhooks", 200);
  return NextResponse.json({
    object: "list",
    data: hooks.map((h) => ({
      id: h.id,
      object: "webhook_endpoint",
      url: h.url,
      events: h.events,
      status: h.status,
      secret: h.secret,
      createdAt: h.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.error;
  const body = await request.json().catch(() => ({}));
  const check = validateWebhookUrl(String(body.url || ""));
  if (!check.ok) {
    await logApi(auth.user.id, "POST", "/v1/webhooks", 400);
    return NextResponse.json({ error: check.error }, { status: 400 });
  }
  const hook = await addWebhook({
    id: uid("wh"),
    userId: auth.user.id,
    url: check.url,
    events: normalizeWebhookEvents(body.events),
    status: "active",
  });
  await logApi(auth.user.id, "POST", "/v1/webhooks", 200);
  return NextResponse.json({
    id: hook.id,
    object: "webhook_endpoint",
    url: hook.url,
    events: hook.events,
    status: hook.status,
    secret: hook.secret,
    createdAt: hook.createdAt,
  });
}

export async function DELETE(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.error;
  const body = await request.json().catch(() => ({}));
  const id = String(body.id || new URL(request.url).searchParams.get("id") || "").trim();
  if (!id) {
    await logApi(auth.user.id, "DELETE", "/v1/webhooks", 400);
    return NextResponse.json({ error: "Webhook id is required." }, { status: 400 });
  }
  const removed = await deleteWebhook(auth.user.id, id);
  if (!removed) {
    await logApi(auth.user.id, "DELETE", "/v1/webhooks", 404);
    return NextResponse.json({ error: "Webhook not found." }, { status: 404 });
  }
  await logApi(auth.user.id, "DELETE", "/v1/webhooks", 200);
  return NextResponse.json({ ok: true, id: removed.id, deleted: true });
}
