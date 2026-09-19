export const FEE_RATES = {
  deposit: 0.015,
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
