export const FEE_RATES = {
  deposit: 0.06,
  withdraw: 0.06,
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

export function momoOutFee(amount: number) {
  return feeOn(amount, FEE_RATES.withdraw);
}

export function momoOutRate() {
  return FEE_RATES.withdraw;
}

export function directTransferFee(amount: number) {
  return feeOn(amount, FEE_RATES.crossNetwork);
}

export function directTransferRate() {
  return FEE_RATES.crossNetwork;
}
