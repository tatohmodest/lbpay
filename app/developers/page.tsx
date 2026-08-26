"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatRelative } from "@/lib/format";
import { useApp } from "@/lib/store";

export default function DevelopersPage() {
  const { state, setEnvironment } = useApp();
  const keys = state.apiKeys.find((k) => k.env === state.environment)!;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Developer overview</h1>
          <p className="text-muted">Monitor API usage, manage keys, and view logs.</p>
        </div>
        <div className="flex rounded-full border border-line bg-white p-1">
          {(["live", "sandbox"] as const).map((env) => (
            <button
              key={env}
              type="button"
              onClick={() => setEnvironment(env)}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase ${
                state.environment === env ? "bg-brand text-white" : "text-muted"
              }`}
            >
              {env}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase text-muted">API success rate</p>
          <p className="mt-2 text-3xl font-black">98.2%</p>
          <span className="mt-2 inline-block rounded-full bg-brand-soft px-2 py-1 text-[10px] font-bold uppercase text-brand-dark">
            Healthy
          </span>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase text-muted">Payouts (30d)</p>
          <p className="mt-2 text-3xl font-black">14,209</p>
          <p className="mt-2 text-sm text-muted">+12% vs last month</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase text-muted">Webhook health</p>
          <p className="mt-2 text-3xl font-black">99.9%</p>
          <p className="mt-2 text-sm text-muted">Avg latency 42ms</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <Card className="p-5 lg:col-span-8">
          <p className="mb-4 text-xs font-bold uppercase text-muted">API requests (30d)</p>
          <div className="flex h-40 items-end gap-2 rounded-xl bg-paper px-4 pt-6">
            {[40, 60, 80, 50, 70, 90, 65, 75, 85, 55].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-brand/80 hover:bg-brand"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </Card>
        <Card className="p-5 lg:col-span-4">
          <h2 className="text-xs font-bold uppercase text-muted">Your API keys</h2>
          <p className="mt-4 text-[11px] font-bold uppercase text-ink">Public key</p>
          <p className="mt-1 truncate rounded-xl bg-paper p-3 font-mono text-xs">{keys.publicKey}</p>
          <p className="mt-4 text-[11px] font-bold uppercase text-ink">Secret key</p>
          <p className="mt-1 truncate rounded-xl bg-paper p-3 font-mono text-xs">
            {keys.secretKeyMasked}
          </p>
        </Card>
        <Card className="bg-navy p-5 text-emerald-100 lg:col-span-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand">
            Quick start · Node.js
          </p>
          <pre className="overflow-x-auto font-mono text-xs leading-6">
{`const payment = await lbpay.payments.create({
  amount: 5000,
  currency: "XAF",
  customer: { phone: "6XXXXXXXX" },
  method: "mobile_money"
});`}
          </pre>
        </Card>
        <Card className="lg:col-span-6">
          <div className="flex items-center justify-between border-b border-line p-4">
            <h2 className="text-xs font-bold uppercase text-muted">Recent logs</h2>
            <Link href="/developers/logs" className="text-xs font-bold uppercase text-brand">
              View all
            </Link>
          </div>
          <div className="divide-y divide-line font-mono text-sm">
            {state.logs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3">
                <span className={log.status >= 400 ? "font-bold text-danger" : "text-muted"}>
                  {log.status}
                </span>
                <span className="flex-1 px-3 font-semibold text-ink">
                  {log.method} {log.path}
                </span>
                <span className="text-xs text-muted">{formatRelative(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
