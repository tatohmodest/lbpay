import Link from "next/link";
import { Logo } from "@/components/logo";
import { LEGAL_NOTE } from "@/lib/flags";

export function DocsContent({ publicHeader = false }: { publicHeader?: boolean }) {
  return (
    <div className="mx-auto max-w-3xl">
      {publicHeader ? (
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <Link href="/signup" className="text-sm font-bold text-brand">
            Get API keys
          </Link>
        </div>
      ) : null}
      <h1 className="text-3xl font-black">LBPay payments API for Cameroon</h1>
      <p className="mt-2 text-muted">
        Collect and disburse XAF with one integration. MTN Mobile Money, Orange Money,
        cards, and the LBPay wallet are rails. Developers integrate LBPay — not a single
        processor.
      </p>
      <section className="mt-8 space-y-4 text-sm leading-7 text-ink">
        <h2 className="text-xl font-bold">Wallet transfer vs disbursement</h2>
        <p>
          LBPay → LBPay is an internal ledger move. The sender’s wallet balance drops and the
          recipient’s wallet balance rises. No Mobile Money rail is involved. The recipient can
          withdraw later.
        </p>
        <pre className="overflow-x-auto rounded-2xl bg-navy p-4 font-mono text-xs text-emerald-100">
{`POST /api/wallet/transfer
{ "to": "@handle", "amount": 5000, "pin": "1234", "note": "Lunch" }`}
        </pre>
        <p>
          Withdrawals and “send to MTN / Orange” are disbursements. Cash leaves LBPay through
          PayUnit (<code>POST /api/disbursement</code> then <code>/api/disbursement/confirm</code>
          on <code>https://gateway.payunit.net</code>).
        </p>
        <pre className="overflow-x-auto rounded-2xl bg-navy p-4 font-mono text-xs text-emerald-100">
{`POST /api/wallet/disburse
{ "amount": 10000, "phone": "670112233", "network": "mtn", "pin": "1234" }`}
        </pre>
        <p>
          Deposits collect from MTN, Orange, or card via PayUnit initialize + makepayment, then
          credit the wallet when the rail reports success.
        </p>
        <h2 className="text-xl font-bold">Account security</h2>
        <ul className="list-disc pl-5 text-muted">
          <li>Signup sends a 6-digit email OTP (Nodemailer / SMTP).</li>
          <li>After OTP, the user sets a 4-digit PIN.</li>
          <li>Login is email + password, then PIN.</li>
          <li>Sends, withdrawals, and deposits require the PIN on a confirmation sheet.</li>
          <li>Mobile: the session lasts; returning to the app after it was inactive asks for the PIN again.</li>
          <li>Web: no PIN lock overlay. Idle for ~18 minutes signs the user out.</li>
        </ul>
        <h2 className="text-xl font-bold">Roles</h2>
        <ul className="list-disc pl-5 text-muted">
          <li>Personal — wallet. Everyone starts here after signup.</li>
          <li>Business — merchant console. Apply with KYC; an admin approves it.</li>
          <li>Developer — sandbox keys immediately on apply; live keys after KYC approval.</li>
          <li>Admin — platform operators. Entering /admin always requires a fresh email OTP.</li>
        </ul>
        <h2 className="text-xl font-bold">Authentication</h2>
        <p>Send your secret key as a Bearer token.</p>
        <pre className="overflow-x-auto rounded-2xl bg-navy p-4 font-mono text-xs text-emerald-100">
          Authorization: Bearer sk_test_...
        </pre>
        <h2 className="text-xl font-bold">Create a payment</h2>
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
        <h2 className="text-xl font-bold">Sandbox amounts</h2>
        <ul className="list-disc pl-5 text-muted">
          <li>Amount ending in 00 → SUCCESS</li>
          <li>Amount ending in 13 → FAILED</li>
          <li>Amount ending in 77 → PENDING</li>
        </ul>
        <h2 className="text-xl font-bold">SDKs (planned)</h2>
        <p className="font-mono text-xs">npm i @lbpay/node · pip install lbpay · Flutter / React Native</p>
        <p className="text-xs text-muted">{LEGAL_NOTE}</p>
      </section>
    </div>
  );
}
