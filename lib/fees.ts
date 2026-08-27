import { detectMobileNetwork } from "@/lib/phone";

export const FEE_RATES = {
  deposit: 0.03,
  withdraw: 0.03,
  crossNetwork: 0.06,
  airtime: 0,
  walletTransfer: 0,
} as const;

export function feeOn(amount: number, rate: number) {
  if (!amount || amount < 0 || !rate) return 0;
  return Math.round(amount * rate);
}

export function depositFee(amount: number) {
  return feeOn(amount, FEE_RATES.deposit);
}

export function airtimeFee() {
  return 0;
}

export function momoOutFee(amount: number, fromPhone: string | undefined, destNetwork: "mtn" | "orange") {
  const from = detectMobileNetwork(fromPhone);
  const cross = (from === "mtn" && destNetwork === "orange") || (from === "orange" && destNetwork === "mtn");
  return feeOn(amount, cross ? FEE_RATES.crossNetwork : FEE_RATES.withdraw);
}

export function momoOutRate(fromPhone: string | undefined, destNetwork: "mtn" | "orange") {
  const from = detectMobileNetwork(fromPhone);
  const cross = (from === "mtn" && destNetwork === "orange") || (from === "orange" && destNetwork === "mtn");
  return cross ? FEE_RATES.crossNetwork : FEE_RATES.withdraw;
}

export function feeLabel(rate: number) {
  return `${Math.round(rate * 100)}%`;
}
