import { NextResponse } from "next/server";
import { settleRailTx } from "@/lib/server/db";
import { getPaymentRail } from "@/lib/providers";
import { requireActiveUser } from "@/lib/server/guard";
import { publicPaymentError } from "@/lib/public-error";

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
