import { depositFee } from "@/lib/fees";
import { payunitReference } from "@/lib/server/crypto";
import {
  findLinkBySlug,
  findUserByHandle,
  findUserById,
  recordLedgerMove,
  recordLinkPayment,
  recordTransfer,
  type StoredUser,
} from "@/lib/server/db";
import { getPaymentRail } from "@/lib/providers";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { assertAmount } from "@/lib/server/limits";
import { publicPaymentError } from "@/lib/public-error";
import { verifyUserPin } from "@/lib/server/pin";
import type { PaymentMethod } from "@/lib/types";

export async function resolveCheckoutTarget(input: { handle?: string; slug?: string }) {
  const slug = String(input.slug || "").trim();
  const handle = String(input.handle || "")
    .replace(/^@/, "")
    .trim()
    .toLowerCase();

  if (slug) {
    const link = await findLinkBySlug(slug);
    if (!link || link.status !== "active") return { error: "This payment link is missing or inactive." };
    const owner = await findUserById(link.userId);
    if (!owner) return { error: "This payment link is missing or inactive." };
    if (owner.status === "frozen") return { error: "This account cannot receive money right now." };
    return { merchant: owner, link };
  }

  if (!handle) return { error: "Who should receive this payment?" };
  const merchant = await findUserByHandle(handle);
  if (!merchant) return { error: "No LBPay account with that ID." };
  if (merchant.status === "frozen") return { error: "This account cannot receive money right now." };
  return { merchant, link: null };
}

export async function startCheckoutPayment(input: {
  handle?: string;
  slug?: string;
  amount: number;
  method: PaymentMethod;
  phone?: string;
  pin?: string;
  returnUrl: string;
  payer?: StoredUser | null;
}) {
  const target = await resolveCheckoutTarget(input);
  if ("error" in target) return { error: target.error, status: 404 as const };

  if (input.method === "card") {
    return { error: "Card payments are not available yet. Please use MTN, Orange, or your wallet.", status: 400 as const };
  }

  const { merchant, link } = target;
  const method: PaymentMethod =
    input.method === "orange"
      ? "orange"
      : input.method === "wallet"
        ? "wallet"
        : "mtn";
  const amount = link?.amount && link.amount > 0 ? link.amount : Number(input.amount);

  if (!amount) return { error: "Enter an amount.", status: 400 as const };

  if (method === "wallet") {
    try {
      await assertAmount(amount, "wallet");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "That amount is not allowed.", status: 400 as const };
    }
    const payer = input.payer;
    if (!payer) return { error: "Sign in to pay from your wallet.", status: 401 as const };
    if (payer.status === "frozen") {
      return { error: "This account is frozen. Contact support.", status: 403 as const };
    }
    if (payer.id === merchant.id) {
      return { error: "You cannot pay your own wallet with wallet balance.", status: 400 as const };
    }
    const pinCheck = await verifyUserPin(payer, String(input.pin || ""));
    if (!pinCheck.ok) {
      return {
        error: pinCheck.error,
        status: pinCheck.status as 400 | 401 | 403 | 404 | 429,
        retryAfter: pinCheck.retryAfter,
      };
    }
    try {
      const moved = await recordTransfer({
        from: payer,
        to: merchant,
        amount,
        note: link?.title || `Paid @${merchant.lbpayId}`,
      });
      if (link) await recordLinkPayment(link.slug, amount);
      return {
        ok: true as const,
        status: "success" as const,
        transactionId: moved.outgoing.id,
        fee: 0,
        payAmount: amount,
        receiveAmount: amount,
      };
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      return {
        error: /insufficient/i.test(raw)
          ? "Insufficient wallet balance. Deposit funds or enter a lower amount."
          : "Transfer could not be completed. Please try again.",
        status: 400 as const,
      };
    }
  }

  try {
    await assertAmount(amount, "deposit");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "That amount is not allowed.", status: 400 as const };
  }

  const phone = cameroonMsisdn(input.phone);
  if (!isCameroonMsisdn(phone)) {
    return { error: "Enter the Mobile Money number that will pay.", status: 400 as const };
  }

  const fee = depositFee(amount);
  const payAmount = amount + fee;
  const reference = payunitReference(method === "orange" ? "OM" : "MT");
  let returnUrl = input.returnUrl;
  try {
    const next = new URL(input.returnUrl);
    next.searchParams.set("tx", reference);
    returnUrl = next.toString();
  } catch {
    /* keep the origin checkout URL */
  }

  try {
    const rail = getPaymentRail();
    const result = await rail.collect({
      amount: payAmount,
      currency: "XAF",
      method,
      customer: {
        phone: phone || undefined,
        name: input.payer?.name || "Customer",
        email: input.payer?.email || merchant.email,
      },
      reference,
      returnUrl,
    });

    if (result.status === "failed") {
      return {
        error:
          result.message ||
          "Your transaction could not be completed. No money has been deducted. Please try again.",
        status: 502 as const,
      };
    }

    const moved = await recordLedgerMove({
      userId: merchant.id,
      amount,
      fee,
      direction: "credit",
      kind: "collection",
      method,
      counterparty: method === "orange" ? `Orange ${phone}` : `MTN ${phone}`,
      note: link?.title || `QR pay · @${merchant.lbpayId}`,
      status: result.status === "success" ? "success" : "pending",
      rail: result.provider,
      railRef: result.reference,
      meta: { linkSlug: link?.slug, handle: merchant.lbpayId, from: phone || undefined },
    });

    if (moved.tx.status === "success" && link) {
      await recordLinkPayment(link.slug, amount);
    }

    return {
      ok: true as const,
      status: moved.tx.status,
      hostedUrl: result.hostedUrl,
      transactionId: result.reference,
      fee,
      payAmount,
      receiveAmount: amount,
    };
  } catch (error) {
    return { error: publicPaymentError(error), status: 500 as const };
  }
}
