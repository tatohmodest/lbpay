import { NextResponse } from "next/server";
import { addWebhook, listWebhooks } from "@/lib/server/db";
import { requireKind } from "@/lib/server/guard";
import { uid } from "@/lib/format";

export async function GET() {
  const auth = await requireKind("developer");
  if (auth.error || !auth.user) return auth.error!;
  return NextResponse.json({ webhooks: await listWebhooks(auth.user.id) });
}

export async function POST(request: Request) {
  const auth = await requireKind("developer");
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const url = String(body.url || "").trim();
  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    return NextResponse.json({ error: "Enter a webhook URL." }, { status: 400 });
  }
  const hook = await addWebhook({
    id: uid("wh"),
    userId: auth.user.id,
    url,
    events: Array.isArray(body.events) && body.events.length ? body.events : ["payment.succeeded", "payment.failed"],
    status: "active",
  });
  return NextResponse.json({ ok: true, webhook: hook });
}
