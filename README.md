# lbpay

LBPay is a payment and financial infrastructure platform for Cameroon — wallets for people, checkout for businesses, and APIs for developers. PayUnit (or another processor) is a rail underneath LBPay, not the product users see.

## Products

- **Wallet** — send, receive, deposit, withdraw, MTN ↔ Orange, airtime, bills, requests, links, QR, `@handles`
- **Business** — collections, payment links, QR, settlements, transaction history
- **Developers** — API keys, sandbox, webhooks, payouts, subscriptions, logs, docs

Brand color: `#00b369`. Amounts are XAF.

## Stack

- Next.js (App Router)
- Supabase (Postgres + Auth + RLS)
- Tailwind CSS v4

## Demo

The UI runs in demo mode without Supabase credentials. Sign in as `modest@lbpay.cm` / `demo123` or click **Continue as @modest**.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase

1. Create a project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor.
3. Put the project URL and anon key in `.env.local`.
4. Set `NEXT_PUBLIC_DEMO_MODE=false` when you switch the app data layer onto Supabase.

## Developer API (sandbox)

```bash
curl http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer sk_test_demo" \
  -H "Content-Type: application/json" \
  -d '{"amount":5000,"currency":"XAF","customer":{"phone":"670112233"},"method":"mobile_money"}'
```

Sandbox amount suffixes: `00` success, `13` failed, `77` pending.

## Compliance

Stored balances, cross-network transfers, custody, savings, lending, and merchant settlement can trigger licensing, KYC/AML, and safeguarding requirements in Cameroon. The architecture supports these features; live money movement should stay behind licensed partners until that is confirmed.
