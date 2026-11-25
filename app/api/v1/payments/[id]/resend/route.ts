import { NextResponse } from "next/server";
import { authenticateApiKey, logApi } from "@/lib/server/apikey";
import { findTxByRailRef, settleRailTx } from "@/lib/server/db";
import { getPaymentRail } from "@/lib/providers";
import { dispatchWebhooksForTx } from "@/lib/server/webhooks";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.error;
  const { user, env } = auth;

  const { id: rawId } = await params;
  const lookupId = decodeURIComponent(rawId || "").trim();
  if (!lookupId) {
    await logApi(user.id, "POST", "/v1/payments/:id/resend", 400);
    return NextResponse.json({ error: "Payment ID is required." }, { status: 400 });
  }

  let tx = await findTxByRailRef(lookupId);
  const isMerchantPayment =
    tx &&
    tx.userId === user.id &&
    (tx.kind === "collection" || (tx.kind === "receive" && Boolean(tx.meta?.handle || tx.meta?.linkSlug)));

  if (!tx || !isMerchantPayment) {
    await logApi(user.id, "POST", `/v1/payments/${lookupId}/resend`, 404);
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  if (tx.status === "pending" && tx.rail === "payunit") {
    try {
      const rail = getPaymentRail("live");
      if (rail.getStatus) {
        const ref = tx.railRef || tx.id;
        const check = await rail.getStatus(ref, { kind: "collect" });
        if (check.status === "success" || check.status === "failed") {
          await settleRailTx(ref, check.status);
          const refreshed = await findTxByRailRef(tx.id);
          if (refreshed) tx = refreshed;
        }
      }
    } catch {
      /* keep current status */
    }
  }

  if (tx.status === "pending") {
    await logApi(user.id, "POST", `/v1/payments/${tx.id}/resend`, 409);
    return NextResponse.json(
      { error: "This payment is still pending. Webhooks are sent once it succeeds or fails." },
      { status: 409 },
    );
  }

  const dispatched = await dispatchWebhooksForTx(tx, { force: true, env });
  await logApi(user.id, "POST", `/v1/payments/${tx.id}/resend`, 200);
  return NextResponse.json({
    ok: true,
    transactionId: tx.id,
    event: dispatched.eventType,
    matched: dispatched.matched,
    delivered: dispatched.sent,
    deliveries: dispatched.deliveries.map((d) => ({
      id: d.id,
      url: d.url,
      status: d.status,
      ok: d.ok,
      durationMs: d.durationMs,
      error: d.error,
    })),
  });
}
