import { NextResponse } from "next/server";
import { authenticateApiKey, logApi } from "@/lib/server/apikey";
import { findTxByRailRef, settleRailTx } from "@/lib/server/db";
import { getPaymentRail } from "@/lib/providers";
import { formatApiPayout } from "@/lib/server/webhooks";

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
    await logApi(user.id, "GET", "/v1/payouts/:id", 400);
    return NextResponse.json({ error: "Payout ID is required." }, { status: 400 });
  }

  let tx = await findTxByRailRef(lookupId);
  if (!tx || tx.userId !== user.id || tx.kind !== "payout") {
    await logApi(user.id, "GET", `/v1/payouts/${lookupId}`, 404);
    return NextResponse.json({ error: "Payout not found." }, { status: 404 });
  }

  if (tx.status === "pending" && tx.rail === "payunit") {
    try {
      const rail = getPaymentRail("live");
      if (rail.getStatus) {
        const ref = tx.railRef || tx.meta?.payoutRef || tx.id;
        const check = await rail.getStatus(ref, { kind: "disburse", payToken: tx.meta?.payToken });
        if (check.status === "success" || check.status === "failed") {
          await settleRailTx(ref, check.status);
          const refreshed = await findTxByRailRef(tx.id);
          if (refreshed) tx = refreshed;
        }
      }
    } catch {
      /* return current ledger status */
    }
  }

  await logApi(user.id, "GET", `/v1/payouts/${tx.id}`, 200);
  return NextResponse.json(formatApiPayout(tx, env));
}
