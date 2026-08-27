import { NextResponse } from "next/server";
import { settleRailTx } from "@/lib/server/db";
import type { TransactionStatus } from "@/lib/types";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const reference = String(
    payload.transaction_id || payload.transactionId || payload.reference || "",
  );
  const rawStatus = String(payload.transaction_status || payload.status || "").toUpperCase();
  const status: TransactionStatus =
    ["SUCCESS", "SUCCESSFUL", "SUCCESSFULL", "PAID", "CONFIRMED"].includes(rawStatus)
      ? "success"
      : rawStatus === "CANCELLED" || rawStatus === "CANCELED"
        ? "cancelled"
        : rawStatus === "FAILED" || rawStatus === "ERROR"
          ? "failed"
          : "pending";

  if (reference && status !== "pending") {
    await settleRailTx(reference, status).catch(() => null);
  }

  return NextResponse.json({ received: true, rail: "payunit", reference, status });
}
