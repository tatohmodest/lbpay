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
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }
    if (existing.userId !== auth.user.id) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }
    if (existing.status === "success" || existing.status === "failed" || existing.status === "cancelled") {
      return NextResponse.json({
        ok: true,
        status: existing.status === "cancelled" ? "failed" : existing.status,
        transactionId: existing.railRef || txId,
        message:
          existing.status === "failed" || existing.status === "cancelled"
            ? "Your transaction could not be completed. No money has been deducted. Please try again."
            : undefined,
      });
    }

    const rail = getPaymentRail();
    let result = rail.getStatus
      ? await rail.getStatus(existing?.railRef || txId, {
          kind: "disburse",
          payToken: existing?.meta?.payToken,
        })
      : { status: "pending" as const, reference: txId, message: undefined };

    // If a first check says "failed" while this row is still pending, re-check once before settling.
    if (result.status === "failed" && existing?.status === "pending" && rail.getStatus) {
      const secondCheck = await rail
        .getStatus(existing.railRef || txId, {
          kind: "disburse",
          payToken: existing.meta?.payToken,
        })
        .catch(() => null);
      if (secondCheck && secondCheck.status !== "failed") {
        result = secondCheck;
      }
    }

    if (result.status === "success" || result.status === "failed") {
      await settleRailTx(existing?.railRef || txId, result.status).catch(() => null);
    }

    const latest = await findTxByRailRef(existing?.railRef || txId);
    const status = latest?.status === "cancelled" ? "failed" : latest?.status || result.status;
    return NextResponse.json({
      ok: true,
      status,
      transactionId: latest?.railRef || result.reference,
      message:
        status === "failed"
          ? result.message ||
            "Your transaction could not be completed. No money has been deducted. Please try again."
          : status === "pending"
            ? "Your transaction is being processed. This usually takes less than two minutes. We will notify you once it completes."
            : undefined,
    });
  } catch (error) {
    return NextResponse.json({ error: publicPaymentError(error) }, { status: 500 });
  }
}
