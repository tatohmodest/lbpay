# lbpay

LBPay is a payment and financial infrastructure platform for Cameroon — wallets for people, checkout for businesses, and APIs for developers. PayUnit (or another processor) is a rail underneath LBPay, not the product users see.

## Products and roles

| Role | How you get it | What it unlocks |
| --- | --- | --- |
| **Personal** | Signup | Wallet: send, receive, deposit, withdraw, bills, airtime, links |
| **Business** | KYC application, admin approval | Merchant console: collections, payment links, QR, settlements |
| **Developer** | Apply: sandbox immediately. Live after KYC approval | API keys, webhooks, logs, payouts. Sandbox never moves live money |
| **Admin** | Listed in `ADMIN_EMAILS` | Users, freeze, KYC, transaction fixes, wallet adjustments, audit. `/admin` always asks for a fresh email OTP |

Brand color: `#00b369`. Amounts are XAF.

## Stack

- Next.js (App Router)
- Nodemailer (signup OTP + admin OTP)
- TanStack Query
- PayUnit REST (`https://gateway.payunit.net`) when credentials are set
- JSON ledger at `data/lbpay.json` (gitignored) until you switch the data layer to Supabase

## Auth

1. Create an account with name, email, phone, and password.
2. Verify email with a 6-digit OTP.
3. Set a 4-digit PIN.
4. Later logins: email + password, then PIN.

There is no demo login. The first operator account is the email you put in `ADMIN_EMAILS`.

**Sessions**

- **Mobile:** cookie lasts a long time. If the app is backgrounded, coming back asks for the PIN.
- **Web:** idle for ~18 minutes signs the user out.
- **Admin:** a separate 20-minute OTP step-up on `/admin`.

## Money movement

- **Wallet transfer** — LBPay → LBPay. Ledger only.
- **Disbursement / withdraw** — LBPay → MTN or Orange via PayUnit. Review + PIN.
- **Deposit** — MTN, Orange, or card → LBPay wallet.
- **API sandbox** — test keys (`sk_test_…`) use the sandbox rail.
- **API live** — `sk_live_…` after developer KYC, uses PayUnit when configured.

## Run locally

```bash
npm install
cp .env.example .env.local
# set ADMIN_EMAILS and SMTP, then:
npm run dev
```

## Supabase

1. Create a project.
2. Run `supabase/migrations/0001_init.sql`, `0002_auth_pin.sql`, and `0003_rbac.sql`.
3. Put the project URL and anon key in `.env.local`.

## Developer API

Create sandbox keys in the developer console after applying, then:

```bash
curl http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer sk_test_YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"amount":5000,"currency":"XAF","customer":{"phone":"6XXXXXXXX"},"method":"mobile_money"}'
```

Sandbox amount suffixes: `00` success, `13` failed, `77` pending.

## Compliance

Stored balances, cross-network transfers, custody, savings, lending, and merchant settlement can trigger licensing, KYC/AML, and safeguarding requirements in Cameroon. Live money movement should stay behind licensed partners until that is confirmed.
