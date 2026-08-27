import { NextResponse } from "next/server";
import { settleRailTx } from "@/lib/server/db";
import { getPaymentRail } from "@/lib/providers";
import { requireActiveUser } from "@/lib/server/guard";

export async function GET(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (auth.error || !auth.user) return auth.error!;
    const tx = new URL(request.url).searchParams.get("tx") || "";
    if (!tx) return NextResponse.json({ error: "Transaction id is required." }, { status: 400 });

    const rail = getPaymentRail();
    const result = rail.getStatus
      ? await rail.getStatus(tx)
      : { status: "pending" as const, reference: tx, message: undefined };
    if (result.status === "success" || result.status === "failed") {
      await settleRailTx(tx, result.status).catch(() => null);
    }
    return NextResponse.json({
      ok: true,
      status: result.status,
      transactionId: result.reference,
      message: result.message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not verify payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
