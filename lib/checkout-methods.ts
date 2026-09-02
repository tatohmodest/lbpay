import { depositFee, FEE_RATES, momoOutFee } from "@/lib/fees";
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
  return method === "wallet" || method === "card" ? 0 : depositFee(amount);
}

export function checkoutFeeBadge(method: PaymentMethod) {
  if (method === "wallet") return "No fee";
  return `Charge ${Math.round(FEE_RATES.deposit * 100)}%`;
}

export function payoutDestinationFee(amount: number, destination: PayoutDestinationId) {
  return destination === "wallet" ? 0 : momoOutFee(amount);
}

export function payoutFeeBadge(destination: PayoutDestinationId) {
  if (destination === "wallet") return "No fee";
  return `Charge ${Math.round(FEE_RATES.withdraw * 100)}%`;
}
