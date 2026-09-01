export type DocItem = { id: string; title: string };
export type DocGroup = { title: string; items: DocItem[] };

export const DOC_GROUPS: DocGroup[] = [
  {
    title: "Get started",
    items: [
      { id: "overview", title: "Overview" },
      { id: "authentication", title: "Authentication" },
      { id: "sandbox", title: "Sandbox" },
    ],
  },
  {
    title: "Money movement",
    items: [
      { id: "ledger", title: "Wallet vs disbursement" },
      { id: "payments", title: "Payments" },
      { id: "payouts", title: "Payouts" },
      { id: "payment-links", title: "Payment links" },
      { id: "balance", title: "Balance" },
    ],
  },
  {
    title: "Platform",
    items: [
      { id: "security", title: "Account security" },
      { id: "roles", title: "Roles" },
      { id: "sdks", title: "SDKs" },
    ],
  },
];

export const DOC_SECTIONS: DocItem[] = DOC_GROUPS.flatMap((group) => group.items);

export const PAYMENT_EXAMPLES = {
  curl: `curl https://lbpay.cm/api/v1/payments \\
  -H "Authorization: Bearer sk_test_YOUR_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "currency": "XAF",
    "customer": { "phone": "670112233" },
    "method": "mobile_money"
  }'`,
  node: `const payment = await lbpay.payments.create({
  amount: 5000,
  currency: "XAF",
  customer: { phone: "670112233" },
  method: "mobile_money",
});`,
} as const;

export const PAYOUT_EXAMPLES = {
  curl: `curl https://lbpay.cm/api/v1/payouts \\
  -H "Authorization: Bearer sk_test_YOUR_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "phone": "670112233",
    "network": "mtn"
  }'`,
  node: `const payout = await lbpay.payouts.create({
  amount: 10000,
  phone: "670112233",
  network: "mtn",
});`,
} as const;

export const LINK_EXAMPLES = {
  curl: `curl https://lbpay.cm/api/v1/payment-links \\
  -H "Authorization: Bearer sk_test_YOUR_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Studio session",
    "amount": 15000
  }'`,
  node: `const link = await lbpay.paymentLinks.create({
  title: "Studio session",
  amount: 15000,
});`,
} as const;
