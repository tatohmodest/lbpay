import { NextResponse } from "next/server";
import { addLink, shopQuotaFor } from "@/lib/server/db";
import { authenticateApiKey, logApi } from "@/lib/server/apikey";
import { payLinkUrl, requestOrigin } from "@/lib/origin";
import { buildPaymentLink, parsePaymentLinkInput } from "@/lib/server/payment-links";
import { isShopSlotLimitError } from "@/lib/shop-limits";

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.error;
  if (!auth.user.roles.includes("business") && !auth.user.roles.includes("admin")) {
    await logApi(auth.user.id, "POST", "/v1/payment-links", 403);
    return NextResponse.json({ error: "Business role required." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (!body.title) body.title = "Payment";
  const parsed = parsePaymentLinkInput(body);
  if (!parsed.ok) {
    await logApi(auth.user.id, "POST", "/v1/payment-links", 400);
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const link = await addLink(buildPaymentLink(auth.user.id, parsed.value));
    await logApi(auth.user.id, "POST", "/v1/payment-links", 200);
    return NextResponse.json({
      id: link.id,
      object: "payment_link",
      title: link.title,
      amount: link.amount,
      currency: "XAF",
      url: payLinkUrl(link.slug, requestOrigin(request)),
      imageUrl: link.imageUrl || null,
      template: link.template,
      status: "active",
      environment: auth.env,
    });
  } catch (err: unknown) {
    if (isShopSlotLimitError(err)) {
      await logApi(auth.user.id, "POST", "/v1/payment-links", 403);
      const quota = await shopQuotaFor(auth.user.id);
      return NextResponse.json({ error: err.message, code: "SHOP_SLOT_LIMIT", quota }, { status: 403 });
    }
    await logApi(auth.user.id, "POST", "/v1/payment-links", 400);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}
