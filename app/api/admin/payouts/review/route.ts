import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/guard";
import { approveHeldPayout, rejectHeldPayout } from "@/lib/server/payout-review";

/** Approve (send to the gateway) or reject (refund) a payout LBPay held for review. */
export async function POST(request: Request) {
  const auth = await requireAdmin("finance");
  if (auth.error || !auth.user) return auth.error!;
  const body = (await request.json().catch(() => ({}))) as { txId?: unknown; action?: unknown; note?: unknown };
  const txId = String(body.txId || "");
  if (!txId) return NextResponse.json({ error: "Pick a payout." }, { status: 400 });
  if (body.action === "approve") {
    const result = await approveHeldPayout(txId, auth.user.id);
    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  }
  if (body.action === "reject") {
    const result = await rejectHeldPayout(txId, auth.user.id, String(body.note || "").slice(0, 200));
    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  }
  return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
}
