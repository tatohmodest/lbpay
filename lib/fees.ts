/**
 * Our payment gateway takes 1.5% of every collection and 1.5% of every payout.
 * - deposit is 1.53% so it covers the gateway's 1.5% of the *gross* amount
 *   (amount + fee), which a flat 1.5% does not.
 * - checkout (a customer paying a shop) is a flat 1.5%: kept round on purpose.
 * - apiCollection is charged to the developer, taken from what they receive.
 */
export const FEE_RATES = {
  deposit: 0.0153,
  checkout: 0.015,
  apiCollection: 0.025,
  withdraw: 0.025,
  crossNetwork: 0.035,
  airtime: 0,
  walletTransfer: 0,
} as const;

export type MomoNetwork = "mtn" | "orange";

export function feeOn(amount: number, rate: number) {
  if (!amount || amount < 0 || !rate) return 0;
  return Math.round(amount * rate);
}

export function depositFee(amount: number) {
  return feeOn(amount, FEE_RATES.deposit);
}

export function checkoutFee(amount: number) {
  return feeOn(amount, FEE_RATES.checkout);
}

/** 2.5% of an API collection, deducted from what the developer is credited. */
export function apiCollectionFee(amount: number) {
  return feeOn(amount, FEE_RATES.apiCollection);
}

export function airtimeFee() {
  return 0;
}

export function momoOutFee(amount: number) {
  return feeOn(amount, FEE_RATES.withdraw);
}

export function momoOutRate() {
  return FEE_RATES.withdraw;
}

export function walletTransferFee() {
  return 0;
}

export function directTransferFee(amount: number, from?: MomoNetwork, to?: MomoNetwork) {
  const cross = !from || !to || from !== to;
  return feeOn(amount, cross ? FEE_RATES.crossNetwork : FEE_RATES.withdraw);
}

export function directTransferRate(from?: MomoNetwork, to?: MomoNetwork) {
  const cross = !from || !to || from !== to;
  return cross ? FEE_RATES.crossNetwork : FEE_RATES.withdraw;
}

export function feePercent(rate: number) {
  const percent = rate * 100;
  if (Number.isInteger(percent)) return String(percent);
  return percent.toFixed(2).replace(/\.?0+$/, "");
}

export function feePercentLabel(rate: number, label = "Charge") {
  return `${label} (${feePercent(rate)}%)`;
}
