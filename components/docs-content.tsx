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
      <h1 className="text-3xl font-black">LBPay API</h1>
      <p className="mt-2 text-muted">
        PayUnit (or any other processor) is a rail. Developers integrate LBPay.
      </p>
      <section className="mt-8 space-y-4 text-sm leading-7 text-ink">
        <h2 className="text-xl font-bold">Authentication</h2>
        <p>Send your secret key as a Bearer token.</p>
        <pre className="overflow-x-auto rounded-2xl bg-navy p-4 font-mono text-xs text-emerald-100">
          Authorization: Bearer sk_test_...
        </pre>
        <h2 className="text-xl font-bold">Create a payment</h2>
        <pre className="overflow-x-auto rounded-2xl bg-navy p-4 font-mono text-xs text-emerald-100">
{`curl https://your-lbpay-host/api/v1/payments \\
  -H "Authorization: Bearer sk_test_demo" \\
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
