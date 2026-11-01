import { checkoutFee, momoOutFee } from "@/lib/fees";
import type { PaymentMethod } from "@/lib/types";

export const CHECKOUT_METHODS = [
  { id: "wallet" as const, label: "LBPay wallet" },
  { id: "mtn" as const, label: "MTN" },
  { id: "orange" as const, label: "Orange" },
];

export const PAYOUT_DESTINATIONS = [
  { id: "wallet" as const, label: "LBPay wallet" },
  { id: "mtn" as const, label: "MTN" },
  { id: "orange" as const, label: "Orange" },
];

export type CheckoutMethodId = (typeof CHECKOUT_METHODS)[number]["id"];
export type PayoutDestinationId = (typeof PAYOUT_DESTINATIONS)[number]["id"];

export function checkoutMethodFee(amount: number, method: PaymentMethod) {
  return method === "wallet" || method === "card" ? 0 : checkoutFee(amount);
}

/** Badges name the fee, never its rate: people read "X%" as a cut of their money. */
export function checkoutFeeBadge(method: PaymentMethod) {
  if (method === "wallet") return "No fee";
  return "Small fee";
}

export function payoutDestinationFee(amount: number, destination: PayoutDestinationId) {
  return destination === "wallet" ? 0 : momoOutFee(amount);
}

export function payoutFeeBadge(destination: PayoutDestinationId) {
  if (destination === "wallet") return "No fee";
  return "Small fee";
}
