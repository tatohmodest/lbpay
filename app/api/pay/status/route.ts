import { NextResponse } from "next/server";
import { findTxByRailRef, settleRailTx } from "@/lib/server/db";
import { getPaymentRail } from "@/lib/providers";
import { publicPaymentError } from "@/lib/public-error";

export async function GET(request: Request) {
  try {
    const tx = new URL(request.url).searchParams.get("tx") || "";
    if (!tx) return NextResponse.json({ error: "Transaction id is required." }, { status: 400 });

    const existing = await findTxByRailRef(tx);
    if (existing && (existing.status === "success" || existing.status === "failed" || existing.status === "cancelled")) {
      return NextResponse.json({
        ok: true,
        status: existing.status === "cancelled" ? "failed" : existing.status,
        transactionId: existing.railRef || tx,
        message:
          existing.status === "failed" || existing.status === "cancelled"
            ? "Your transaction could not be completed. No money has been deducted. Please try again."
            : undefined,
      });
    }

    const rail = getPaymentRail();
    const result = rail.getStatus
      ? await rail.getStatus(existing?.railRef || tx, { kind: "collect" })
      : { status: "pending" as const, reference: tx, message: undefined };
    if (result.status === "success" || result.status === "failed") {
      await settleRailTx(existing?.railRef || tx, result.status).catch(() => null);
    }
    const latest = await findTxByRailRef(existing?.railRef || tx);
    const status = latest?.status === "cancelled" ? "failed" : latest?.status || result.status;
    return NextResponse.json({
      ok: true,
      status,
      transactionId: result.reference || tx,
      message:
        status === "failed"
          ? result.message ||
            "Your transaction could not be completed. No money has been deducted. Please try again."
          : status === "pending"
            ? "Your transaction is being processed. This usually takes less than two minutes."
            : undefined,
    });
  } catch (error) {
    return NextResponse.json({ error: publicPaymentError(error) }, { status: 500 });
  }
}
