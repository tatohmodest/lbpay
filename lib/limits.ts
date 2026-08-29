import { formatXAF } from "@/lib/format";

export const LIMITS = {
  walletTransferMin: 100,
  depositMin: 100,
  /** Withdrawals and Mobile Money payouts. Not the 100 XAF wallet/deposit floor. */
  momoOutMin: 1000,
  withdrawMin: 1000,
  momoOutMax: 500_000,
  kycLevel1Daily: 500_000,
} as const;

export type LimitKind = "withdraw" | "momo" | "deposit" | "wallet";

export function limitsFor(kind: LimitKind) {
  if (kind === "wallet") return { min: LIMITS.walletTransferMin, max: null as number | null };
  if (kind === "deposit") return { min: LIMITS.depositMin, max: null as number | null };
  if (kind === "withdraw") return { min: LIMITS.withdrawMin, max: LIMITS.momoOutMax };
  return { min: LIMITS.momoOutMin, max: LIMITS.momoOutMax };
}

export function amountIssue(amount: number, kind: LimitKind) {
  const { min, max } = limitsFor(kind);
  if (!amount) return "";
  if (amount < min) {
    if (kind === "withdraw") return `Withdrawal amount must be at least ${formatXAF(min)}.`;
    if (kind === "momo") return `Minimum transfer amount is ${formatXAF(min)}.`;
    return `Minimum amount is ${formatXAF(min)}.`;
  }
  if (max && amount > max) {
    if (kind === "withdraw") {
      return `Maximum withdrawal per transaction is ${formatXAF(max)}. Reduce the amount and try again.`;
    }
    return `Maximum amount per transaction is ${formatXAF(max)}.`;
  }
  return "";
}

export function cameroonDay(iso?: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Douala" }).format(iso ? new Date(iso) : new Date());
}

export function isKycLevel2(personal?: string) {
  return personal === "verified";
}

export function dailyOutboundCap(personal?: string) {
  return isKycLevel2(personal) ? null : LIMITS.kycLevel1Daily;
}

export function outboundKinds(kind: string) {
  return kind === "withdraw" || kind === "payout" || kind === "cross_network";
}
