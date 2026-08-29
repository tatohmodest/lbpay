import Link from "next/link";
import { LEGAL_NOTE } from "@/lib/flags";

export function DocsContent() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">Developers</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
        Payments API for Cameroon
      </h1>
      <p className="mt-3 text-[15px] leading-7 text-muted">
        Collect and disburse XAF with one integration. MTN Mobile Money, Orange Money, cards,
        and the LBPay wallet are rails. Developers integrate LBPay, not a single processor.
      </p>
      <section className="mt-10 space-y-4 text-sm leading-7 text-ink">
        <h2 className="text-xl font-semibold">Wallet transfer vs disbursement</h2>
        <p>
          LBPay to LBPay is an internal ledger move. The sender’s wallet balance drops and the
          recipient’s wallet balance rises. No Mobile Money rail is involved. The recipient can
          withdraw later.
        </p>
        <pre className="overflow-x-auto rounded-2xl bg-navy p-4 font-mono text-xs text-emerald-100">
{`POST /api/wallet/transfer
{ "to": "@handle", "amount": 5000, "pin": "1234", "note": "Lunch" }`}
        </pre>
        <p>
          Withdrawals and “send to MTN / Orange” are disbursements. Cash leaves LBPay through
          PayUnit (<code>POST /api/gateway/deposit</code> then <code>/api/gateway/deposit/confirm</code>
          on <code>https://gateway.payunit.net</code>, account number <code>237</code> + 9-digit
          MSISDN). Deposit is 2%. Withdrawal is 3%.
        </p>
        <pre className="overflow-x-auto rounded-2xl bg-navy p-4 font-mono text-xs text-emerald-100">
{`POST /api/wallet/disburse
{ "amount": 10000, "phone": "670112233", "network": "mtn", "pin": "1234" }`}
        </pre>
        <p>
          Deposits collect from MTN, Orange, or card via PayUnit initialize + makepayment, then
          credit the wallet when the rail reports success.
        </p>
        <h2 className="text-xl font-semibold">Account security</h2>
        <ul className="list-disc pl-5 text-muted">
          <li>Signup sends a 6-digit email OTP (Nodemailer / SMTP).</li>
          <li>After OTP, the user sets a 4-digit PIN.</li>
          <li>Login is email + password, then PIN.</li>
          <li>Sends, withdrawals, and deposits require the PIN on a confirmation sheet.</li>
          <li>Mobile: the session lasts; returning to the app after it was inactive asks for the PIN again.</li>
          <li>Web: no PIN lock overlay. Idle for about 18 minutes signs the user out.</li>
        </ul>
        <h2 className="text-xl font-semibold">Roles</h2>
        <ul className="list-disc pl-5 text-muted">
          <li>Personal: wallet. Verify your account from Profile when you want business benefits.</li>
          <li>Business: merchant console. Available after your account is verified.</li>
          <li>Developer: apply from Profile. Portal, sandbox keys, and live keys unlock after approval.</li>
          <li>Admin: platform operators. Entering /admin asks for an email OTP. That operator session lasts about 8 hours.</li>
        </ul>
        <h2 className="text-xl font-semibold">Authentication</h2>
        <p>Send your secret key as a Bearer token.</p>
        <pre className="overflow-x-auto rounded-2xl bg-navy p-4 font-mono text-xs text-emerald-100">
          Authorization: Bearer sk_test_...
        </pre>
        <h2 className="text-xl font-semibold">Create a payment</h2>
        <pre className="overflow-x-auto rounded-2xl bg-navy p-4 font-mono text-xs text-emerald-100">
{`curl https://your-lbpay-host/api/v1/payments \\
  -H "Authorization: Bearer sk_test_YOUR_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "currency": "XAF",
    "customer": { "phone": "670112233" },
    "method": "mobile_money"
  }'`}
        </pre>
        <h2 className="text-xl font-semibold">Sandbox amounts</h2>
        <ul className="list-disc pl-5 text-muted">
          <li>Amount ending in 00: SUCCESS</li>
          <li>Amount ending in 13: FAILED</li>
          <li>Amount ending in 77: PENDING</li>
        </ul>
        <h2 className="text-xl font-semibold">SDKs (planned)</h2>
        <p className="font-mono text-xs">npm i @lbpay/node · pip install lbpay · Flutter / React Native</p>
        <p className="text-xs text-muted">{LEGAL_NOTE}</p>
        <p className="pt-4">
          <Link href="/signup" className="text-sm font-medium text-brand-deep">
            Get API keys
          </Link>
        </p>
      </section>
    </div>
  );
}
