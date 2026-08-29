import { NextResponse } from "next/server";
import { findTxByRailRef, settleRailTx } from "@/lib/server/db";
import { getPaymentRail } from "@/lib/providers";
import { requireActiveUser } from "@/lib/server/guard";
import { publicPaymentError } from "@/lib/public-error";

export async function GET(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (auth.error || !auth.user) return auth.error!;
    const txId = new URL(request.url).searchParams.get("tx") || "";
    if (!txId) return NextResponse.json({ error: "Transaction id is required." }, { status: 400 });

    const existing = await findTxByRailRef(txId);
    const rail = getPaymentRail();
    const result = rail.getStatus
      ? await rail.getStatus(existing?.railRef || txId, {
          kind: "disburse",
          payToken: existing?.meta?.payToken,
        })
      : { status: "pending" as const, reference: txId, message: undefined };
    if (result.status === "success" || result.status === "failed") {
      await settleRailTx(existing?.railRef || txId, result.status).catch(() => null);
    }
    return NextResponse.json({
      ok: true,
      status: result.status,
      transactionId: result.reference,
      message:
        result.status === "failed"
          ? result.message ||
            "Your transaction could not be completed. No money has been deducted. Please try again."
          : result.status === "pending"
            ? "Your transaction is being processed. This usually takes less than two minutes. We will notify you once it completes."
            : undefined,
    });
  } catch (error) {
    return NextResponse.json({ error: publicPaymentError(error) }, { status: 500 });
  }
}
