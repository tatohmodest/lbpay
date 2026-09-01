import Link from "next/link";
import { ArrowRight, BookOpen, KeyRound, Link2, Send, Wallet } from "lucide-react";
import { CodeBlock, CodeTabs } from "@/components/docs/code-block";
import { LEGAL_NOTE } from "@/lib/flags";
import { LINK_EXAMPLES, PAYMENT_EXAMPLES, PAYOUT_EXAMPLES } from "@/lib/docs";
import { cn } from "@/lib/cn";

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-[calc(var(--header-h)+1.25rem)]">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-deep">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink md:text-[1.75rem]">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-[#3c4257] [&_code]:rounded-md [&_code]:bg-[#eef3f7] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-ink">
        {children}
      </div>
    </section>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#c1e4d4] bg-brand-soft/70 px-4 py-3 text-sm leading-6 text-ink">
      {children}
    </div>
  );
}

const guides = [
  {
    href: "#payments",
    icon: Wallet,
    title: "Accept a payment",
    copy: "Collect XAF from MTN, Orange, card, or wallet.",
  },
  {
    href: "#payouts",
    icon: Send,
    title: "Send a payout",
    copy: "Disburse to a Cameroon MSISDN on MTN or Orange.",
  },
  {
    href: "#payment-links",
    icon: Link2,
    title: "Create a payment link",
    copy: "Share a URL. Collect without building a checkout.",
  },
  {
    href: "#authentication",
    icon: KeyRound,
    title: "Get API keys",
    copy: "Apply from Profile. Sandbox first, live after KYC.",
  },
];

export function DocsContent({
  compact = false,
  hideHeader = false,
}: {
  compact?: boolean;
  hideHeader?: boolean;
}) {
  return (
    <div className={compact ? "" : "max-w-3xl"}>
      {hideHeader ? null : (
        <header id="overview" className="scroll-mt-[calc(var(--header-h)+1.25rem)]">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-deep">
            <BookOpen className="h-3.5 w-3.5" />
            Documentation
          </p>
          <h1 className="mt-3 text-[2.15rem] font-semibold leading-[1.12] tracking-[-0.035em] text-ink md:text-[2.75rem]">
            Payments API for Cameroon
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-8 text-muted">
            Collect and disburse XAF with one integration. MTN Mobile Money, Orange Money, cards,
            and the LBPay wallet are rails. You integrate LBPay, not a single processor.
          </p>
        </header>
      )}
      {hideHeader ? <div id="overview" className="scroll-mt-[calc(var(--header-h)+1.25rem)]" /> : null}

      {compact ? null : (
        <div className={cn("grid gap-3 sm:grid-cols-2", hideHeader ? "mt-0" : "mt-10")}>
          {guides.map((guide) => (
            <a
              key={guide.href}
              href={guide.href}
              className="group rounded-xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(10,37,64,0.04)] transition hover:border-brand/30 hover:shadow-[0_10px_30px_rgba(10,37,64,0.08)]"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-brand-deep">
                <guide.icon className="h-4 w-4" />
              </span>
              <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-ink">
                {guide.title}
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </span>
              <span className="mt-1 block text-sm leading-6 text-muted">{guide.copy}</span>
            </a>
          ))}
        </div>
      )}

      <div className="mt-14 space-y-16">
        <Section id="authentication" title="Authentication">
          <p>Send your secret key as a Bearer token. Test keys start with <code>sk_test_</code>. Live keys start with <code>sk_live_</code>.</p>
          <CodeBlock code={`Authorization: Bearer sk_test_...`} label="Header" />
          <Callout>
            Apply from Profile. Sandbox and live keys appear in the Developer Portal after
            approval. Live payouts also need verified developer KYC.
          </Callout>
        </Section>

        <Section id="ledger" title="Wallet transfer vs disbursement">
          <p>
            LBPay to LBPay is an internal ledger move. The sender’s wallet balance drops and the
            recipient’s wallet balance rises. No Mobile Money rail is involved. The recipient can
            withdraw later.
          </p>
          <CodeBlock
            label="POST /api/wallet/transfer"
            code={`POST /api/wallet/transfer
{ "to": "@handle", "amount": 5000, "pin": "1234", "note": "Lunch" }`}
          />
          <p>
            Withdrawals and “send to MTN / Orange” are disbursements. Cash leaves LBPay through
            PayUnit (<code>POST /api/gateway/deposit</code> then{" "}
            <code>/api/gateway/deposit/confirm</code> on <code>https://gateway.payunit.net</code>,
            account number <code>237</code> + 9-digit MSISDN). Deposit is 2%. Withdrawal is 3%.
            Minimum withdrawal is 1,000 XAF. PayUnit must enable the deposit/disbursement product
            on the merchant account; a PayUnit wallet balance alone is not enough.
          </p>
          <CodeBlock
            label="POST /api/wallet/disburse"
            code={`POST /api/wallet/disburse
{ "amount": 10000, "phone": "670112233", "network": "mtn", "pin": "1234" }`}
          />
          <p>
            Deposits collect from MTN, Orange, or card via PayUnit initialize + makepayment, then
            credit the wallet when the rail reports success.
          </p>
        </Section>

        <Section id="payments" title="Create a payment">
          <p>
            <code>POST /api/v1/payments</code> collects XAF. Use <code>method</code>{" "}
            <code>mobile_money</code>, <code>mtn</code>, <code>orange</code>, <code>card</code>, or{" "}
            <code>wallet</code>.
          </p>
          <CodeTabs examples={PAYMENT_EXAMPLES} />
        </Section>

        <Section id="payouts" title="Create a payout">
          <p>
            <code>POST /api/v1/payouts</code> sends XAF to a Cameroon phone on MTN or Orange. The
            merchant wallet is debited, plus the 3% withdrawal fee.
          </p>
          <CodeTabs examples={PAYOUT_EXAMPLES} />
        </Section>

        <Section id="payment-links" title="Payment links">
          <p>
            <code>POST /api/v1/payment-links</code> creates a hosted checkout URL. Business role
            required.
          </p>
          <CodeTabs examples={LINK_EXAMPLES} />
        </Section>

        <Section id="balance" title="Balance">
          <p>
            <code>GET /api/v1/balance</code> returns available XAF for the authenticated merchant.
          </p>
          <CodeBlock
            label="GET /api/v1/balance"
            code={`curl https://lbpay.cm/api/v1/balance \\
  -H "Authorization: Bearer sk_test_YOUR_SECRET"`}
          />
        </Section>

        <Section id="sandbox" title="Sandbox amounts">
          <p>Test keys never move live money. Use the amount to drive the rail result:</p>
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-canvas text-[11px] uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Amount rule</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white">
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs">ending in 00</td>
                  <td className="px-4 py-2.5">SUCCESS</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs">ending in 13</td>
                  <td className="px-4 py-2.5">FAILED</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-xs">ending in 77</td>
                  <td className="px-4 py-2.5">PENDING</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="security" title="Account security">
          <ul className="list-disc space-y-1 pl-5">
            <li>Signup sends a 6-digit email OTP (Nodemailer / SMTP).</li>
            <li>After OTP, the user sets a 4-digit PIN.</li>
            <li>Login is email + password, then PIN.</li>
            <li>Sends, withdrawals, and deposits require the PIN on a confirmation sheet.</li>
            <li>Mobile: the session lasts; returning to the app after it was inactive asks for the PIN again.</li>
            <li>Web: no PIN lock overlay. Idle for about 18 minutes signs the user out.</li>
          </ul>
        </Section>

        <Section id="roles" title="Roles">
          <ul className="list-disc space-y-1 pl-5">
            <li>Personal: wallet. Verify your account from Profile when you want business benefits.</li>
            <li>Business: merchant console. Available after your account is verified.</li>
            <li>Developer: apply from Profile. Portal, sandbox keys, and live keys unlock after approval.</li>
            <li>Admin: platform operators. Entering /admin asks for an email OTP. That operator session lasts about 8 hours.</li>
          </ul>
        </Section>

        <Section id="sdks" title="SDKs">
          <p>Official libraries are planned. Until then, call the HTTP API directly.</p>
          <p className="font-mono text-xs text-ink">npm i @lbpay/node · pip install lbpay · Flutter / React Native</p>
          <p className="text-xs text-muted">{LEGAL_NOTE}</p>
          <p className="pt-2">
            <Link href="/signup" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-deep">
              Get API keys <ArrowRight className="h-4 w-4" />
            </Link>
          </p>
        </Section>
      </div>
    </div>
  );
}
