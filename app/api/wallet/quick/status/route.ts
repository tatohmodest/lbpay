import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/server/guard";
import { publicPaymentError } from "@/lib/public-error";
import { progressQuickTransfer } from "@/lib/server/quick";

export async function GET(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (auth.error || !auth.user) return auth.error!;
    const tx = new URL(request.url).searchParams.get("tx") || "";
    if (!tx) return NextResponse.json({ error: "Transaction id is required." }, { status: 400 });
    const result = await progressQuickTransfer(tx);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: publicPaymentError(error) }, { status: 500 });
  }
}
