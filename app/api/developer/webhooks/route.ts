import { NextResponse } from "next/server";
import {
  addWebhook,
  deleteWebhook,
  findTxByRailRef,
  findWebhookById,
  listWebhookDeliveries,
  listWebhooks,
  settleRailTx,
} from "@/lib/server/db";
import { requireKind } from "@/lib/server/guard";
import { getPaymentRail } from "@/lib/providers";
import {
  dispatchWebhooksForTx,
  normalizeWebhookEvents,
  sendTestWebhook,
  validateWebhookUrl,
} from "@/lib/server/webhooks";
import { uid } from "@/lib/format";

export async function GET() {
  const auth = await requireKind("developer");
  if (auth.error || !auth.user) return auth.error!;
  const [webhooks, deliveries] = await Promise.all([
    listWebhooks(auth.user.id),
    listWebhookDeliveries(auth.user.id, 30),
  ]);
  return NextResponse.json({ webhooks, deliveries });
}

export async function POST(request: Request) {
  const auth = await requireKind("developer");
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));

  if (body.action === "test") {
    const hook = await findWebhookById(auth.user.id, String(body.id || ""));
    if (!hook) return NextResponse.json({ error: "Webhook not found." }, { status: 404 });
    const delivery = await sendTestWebhook(hook);
    return NextResponse.json({ ok: delivery.ok, delivery });
  }

  if (body.action === "resend") {
    const txId = String(body.transactionId || "").trim();
    if (!txId) {
      return NextResponse.json({ error: "Enter a transaction ID (e.g. TXN_...)." }, { status: 400 });
    }
    let tx = await findTxByRailRef(txId);
    if (!tx || tx.userId !== auth.user.id) {
      return NextResponse.json({ error: "Transaction not found on your account." }, { status: 404 });
    }
    if (tx.status === "pending" && tx.rail === "payunit") {
      try {
        const rail = getPaymentRail("live");
        if (rail.getStatus) {
          const ref = tx.railRef || tx.id;
          const kind = tx.kind === "payout" ? "disburse" : "collect";
          const check = await rail.getStatus(ref, { kind, payToken: tx.meta?.payToken });
          if (check.status === "success" || check.status === "failed") {
            await settleRailTx(ref, check.status);
            const refreshed = await findTxByRailRef(tx.id);
            if (refreshed) tx = refreshed;
          }
        }
      } catch {
        /* keep current ledger status */
      }
    }
    if (tx.status === "pending") {
      return NextResponse.json(
        { error: "This transaction is still pending. Webhooks fire once it succeeds or fails." },
        { status: 409 },
      );
    }
    const dispatched = await dispatchWebhooksForTx(tx, { force: true });
    if (!dispatched.eventType) {
      return NextResponse.json(
        { error: "Only payment collection and payout transactions emit developer webhooks." },
        { status: 400 },
      );
    }
    if (!dispatched.matched) {
      return NextResponse.json(
        { error: `No active webhook endpoint is subscribed to ${dispatched.eventType}.` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      ok: dispatched.sent > 0,
      transactionId: tx.id,
      event: dispatched.eventType,
      matched: dispatched.matched,
      delivered: dispatched.sent,
      deliveries: dispatched.deliveries,
    });
  }

  const check = validateWebhookUrl(String(body.url || ""));
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }
  const hook = await addWebhook({
    id: uid("wh"),
    userId: auth.user.id,
    url: check.url,
    events: normalizeWebhookEvents(body.events),
    status: "active",
  });
  return NextResponse.json({ ok: true, webhook: hook });
}

export async function DELETE(request: Request) {
  const auth = await requireKind("developer");
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const id = String(body.id || new URL(request.url).searchParams.get("id") || "").trim();
  if (!id) return NextResponse.json({ error: "Webhook id is required." }, { status: 400 });
  const removed = await deleteWebhook(auth.user.id, id);
  if (!removed) return NextResponse.json({ error: "Webhook not found." }, { status: 404 });
  return NextResponse.json({ ok: true, id: removed.id });
}
