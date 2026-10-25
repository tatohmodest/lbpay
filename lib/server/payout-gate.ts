import { NextResponse } from "next/server";
import { payoutSwitch } from "@/lib/server/db";

/** Returns a response to send back when payouts are switched off, otherwise null. */
export async function payoutsPausedResponse() {
  const sw = await payoutSwitch();
  if (sw.on) return null;
  return NextResponse.json(
    {
      error:
        "Withdrawals are paused for a short safety check. Your money is safe in your LBPay wallet. Please try again later.",
      code: "PAYOUTS_PAUSED",
    },
    { status: 503 },
  );
}
