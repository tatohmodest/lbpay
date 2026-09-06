/**
 * Product architecture can support these, but some require
 * licensing / KYC / AML / safeguarding in Cameroon before going live.
 */
export const FEATURES = {
  storedWallet: true,
  crossNetwork: true,
  paymentLinks: true,
  qrPayments: true,
  payouts: true,
  subscriptions: true,
  marketplaceSplits: true,
  savings: false,
  lending: false,
  /** Cross-border send is built, but held until the corridor is live. */
  international: false,
} as const;

export const INTERNATIONAL_OPENS = "this Friday";

export const LEGAL_NOTE =
  "Stored balances, cross-network transfers, custody, savings, lending, and merchant settlement can trigger licensing, KYC/AML, and safeguarding requirements. Confirm what can be offered directly versus through a licensed partner before enabling live money movement.";
