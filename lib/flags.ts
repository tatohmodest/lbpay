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

export const INTERNATIONAL_OPENS = "soon";

/**
 * Public, user-facing disclosure. Shown in the footer and on money screens.
 * Keep it plain and true: who runs LBPay and how money moves.
 */
export const LEGAL_NOTE =
  "LBPay is a product of Looping Binary, built in Cameroon. Mobile Money payments run on the MTN Mobile Money and Orange Money networks through our payment processing partner. LBPay is not a bank. MTN and Orange are trademarks of their respective owners.";

export const CONTACT_EMAIL = "loopingbinary@gmail.com";
