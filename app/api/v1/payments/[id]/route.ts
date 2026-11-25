import { NextResponse } from "next/server";
import { authenticateApiKey, logApi } from "@/lib/server/apikey";
import { findTxByRailRef, settleRailTx } from "@/lib/server/db";
import { getPaymentRail } from "@/lib/providers";
import { formatApiPayment } from "@/lib/server/webhooks";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.error;
  const { user, env } = auth;

  const { id: rawId } = await params;
  const lookupId = decodeURIComponent(rawId || "").trim();
  if (!lookupId) {
    await logApi(user.id, "GET", "/v1/payments/:id", 400);
    return NextResponse.json({ error: "Payment ID is required." }, { status: 400 });
  }

  let tx = await findTxByRailRef(lookupId);
  const isMerchantPayment =
    tx &&
    tx.userId === user.id &&
    (tx.kind === "collection" || (tx.kind === "receive" && Boolean(tx.meta?.handle || tx.meta?.linkSlug)));

  if (!tx || !isMerchantPayment) {
    await logApi(user.id, "GET", `/v1/payments/${lookupId}`, 404);
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  // Self-heal pending live payments by verifying directly with the gateway.
  if (tx.status === "pending" && tx.rail === "payunit") {
    try {
      const rail = getPaymentRail("live");
      if (rail.getStatus) {
        const ref = tx.railRef || tx.id;
        let check = await rail.getStatus(ref, { kind: "collect" });
        if (check.status === "failed") {
          const second = await rail.getStatus(ref, { kind: "collect" }).catch(() => null);
          if (second && second.status !== "failed") check = second;
        }
        if (check.status === "success" || check.status === "failed") {
          await settleRailTx(ref, check.status);
          const refreshed = await findTxByRailRef(tx.id);
          if (refreshed) tx = refreshed;
        }
      }
    } catch {
      /* return current ledger status if the gateway is unreachable */
    }
  }

  await logApi(user.id, "GET", `/v1/payments/${tx.id}`, 200);
  return NextResponse.json(formatApiPayment(tx, env));
}
