import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/guard";
import { startCheckoutPayment } from "@/lib/server/checkout";
import { payHandlePath, payLinkPath, requestOrigin, sameOriginReturnUrl } from "@/lib/origin";
import type { PaymentMethod } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const origin = requestOrigin(request);
  const handle = String(body.handle || "")
    .replace(/^@/, "")
    .trim();
  const slug = String(body.slug || "").trim();
  const fallbackPath = slug ? payLinkPath(slug) : payHandlePath(handle || "pay");
  const returnUrl = sameOriginReturnUrl(String(body.returnUrl || ""), origin, fallbackPath);
  const method = String(body.method || "mtn") as PaymentMethod;
  const payer = await currentUser();

  const result = await startCheckoutPayment({
    handle,
    slug,
    amount: Number(body.amount),
    method,
    phone: body.phone,
    pin: body.pin,
    returnUrl,
    payer,
  });

  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status || 400 });
  }

  return NextResponse.json({
    ok: true,
    status: result.status,
    hostedUrl: "hostedUrl" in result ? result.hostedUrl : undefined,
    transactionId: result.transactionId,
    fee: result.fee,
    payAmount: result.payAmount,
    receiveAmount: result.receiveAmount,
  });
}
