# lbpay

LBPay is a payment and financial infrastructure platform for Cameroon — wallets for people, checkout for businesses, and APIs for developers. PayUnit (or another processor) is a rail underneath LBPay, not the product users see.

## Products

- **Wallet** — send, receive, deposit, withdraw, MTN ↔ Orange, airtime, bills, requests, links, QR, `@handles`
- **Business** — collections, payment links, QR, settlements, transaction history
- **Developers** — API keys, sandbox, webhooks, payouts, subscriptions, logs, docs

Brand color: `#00b369`. Amounts are XAF.

## Stack

- Next.js (App Router)
- Nodemailer (email OTP)
- TanStack Query (wallet mutations)
- PayUnit REST (`https://gateway.payunit.net`) when credentials are set
- Supabase (Postgres schema ready; local demo uses `data/lbpay.json`)
- Tailwind CSS v4

## Auth

1. Create an account with name, email, phone, and password.
2. Verify email with a 6-digit OTP (SMTP, or printed in the server log if SMTP is empty).
3. Set a 4-digit PIN.
4. Later logins: email + password, then PIN.

Demo: `modest@lbpay.cm` / `demo123` / PIN `1234`. Seeded wallets also exist for `@kossi` and `@marie`.

**Sessions**

- **Mobile:** cookie lasts a long time. If the app is backgrounded / the window is not active, coming back asks for the PIN.
- **Web:** no PIN overlay. About 18 minutes of inactivity signs the user out. Bottom navigation is phone-only.

## Money movement

- **Wallet transfer** — LBPay → LBPay. Ledger only. Recipient can withdraw later.
- **Disbursement / withdraw** — LBPay → MTN or Orange via PayUnit. Review + PIN required.
- **Deposit** — MTN, Orange, or card → LBPay wallet via PayUnit collect.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Add SMTP credentials when you want real OTP email. Add PayUnit keys when you want the live rail; otherwise the sandbox adapter is used.

## Supabase

1. Create a project.
2. Run `supabase/migrations/0001_init.sql` then `0002_auth_pin.sql` in the SQL editor.
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
