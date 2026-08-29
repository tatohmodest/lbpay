import { NextResponse } from "next/server";
import { findTxByRailRef, settleRailTx } from "@/lib/server/db";
import type { TransactionStatus } from "@/lib/types";
import { progressQuickTransfer } from "@/lib/server/quick";
import { railStatus, unwrapPayunitNotify } from "@/lib/providers/payunit-parse";

function toLedgerStatus(rawStatus: string): TransactionStatus {
  const mapped = railStatus(rawStatus);
  if (mapped === "success") return "success";
  if (/cancel/i.test(rawStatus)) return "cancelled";
  if (mapped === "failed") return "failed";
  return "pending";
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const parsed = unwrapPayunitNotify(payload && typeof payload === "object" ? payload : {});
  const reference = parsed.reference;
  const status = toLedgerStatus(parsed.rawStatus);

  if (reference && status !== "pending") {
    const existing = await findTxByRailRef(reference);
    if (existing?.kind === "cross_network") {
      await progressQuickTransfer(existing.railRef || reference).catch(() => null);
    } else {
      await settleRailTx(reference, status).catch(() => null);
    }
  }

  return NextResponse.json({ received: true, rail: "payunit", reference, status });
}
