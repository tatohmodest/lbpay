import { NextResponse } from "next/server";
import { findTxByRailRef, settleRailTx, writeAudit } from "@/lib/server/db";
import { progressQuickTransfer } from "@/lib/server/quick";
import { getPaymentRail } from "@/lib/providers";
import { unwrapPayunitNotify } from "@/lib/providers/payunit-parse";

const PAYOUT_KINDS = new Set(["withdraw", "payout", "international", "send"]);

/**
 * Gateway callback. Anyone on the internet can POST here, so the body is only a
 * hint about WHICH transaction changed. We never trust the status it claims:
 * we ask the gateway directly and settle on that answer.
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const parsed = unwrapPayunitNotify(payload && typeof payload === "object" ? payload : {});
  const reference = parsed.reference;
  if (!reference) return NextResponse.json({ received: true });

  const existing = await findTxByRailRef(reference);
  if (!existing) return NextResponse.json({ received: true });

  if (existing.kind === "cross_network") {
    // Checks the gateway itself.
    await progressQuickTransfer(existing.railRef || reference).catch(() => null);
    return NextResponse.json({ received: true });
  }
  if (existing.status !== "pending") return NextResponse.json({ received: true });

  const rail = getPaymentRail();
  if (!rail.getStatus) return NextResponse.json({ received: true });
  const verified = await rail
    .getStatus(existing.railRef || reference, {
      kind: PAYOUT_KINDS.has(existing.kind) ? "disburse" : "collect",
      payToken: existing.meta?.payToken,
    })
    .catch(() => null);

  const claimed = String(parsed.rawStatus || "").slice(0, 40);
  if (verified && (verified.status === "success" || verified.status === "failed")) {
    await settleRailTx(existing.railRef || reference, verified.status).catch(() => null);
  }
  // A callback that disagrees with the gateway is worth knowing about.
  if (verified && claimed && !new RegExp(verified.status, "i").test(claimed) && verified.status !== "pending") {
    await writeAudit({
      actorId: "system",
      action: "webhook.mismatch",
      targetType: "transaction",
      targetId: existing.id,
      note: `claimed ${claimed}, gateway says ${verified.status}`,
    }).catch(() => null);
  }
  return NextResponse.json({ received: true });
}
