"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, FileCheck, MessageSquare, RefreshCw, Users, Wallet } from "lucide-react";
import { AppImg } from "@/components/app-img";
import { AdminHeader, AdminPanel, AdminStat } from "@/components/admin/ui";
import { AdminBars } from "@/components/admin/bars";
import { PayoutSwitch } from "@/components/admin/payout-switch";
import { useAdminSession } from "@/components/role-gate";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate, formatXAF } from "@/lib/format";
import { kindTitle } from "@/lib/tx";
import { cn } from "@/lib/cn";
import type { AdminStats } from "@/lib/server/admin-stats";

const shortcuts = [
  { href: "/admin/support", label: "Chat with us", copy: "Reply to people in the app", icon: MessageSquare, scope: "support" },
  { href: "/admin/kyc", label: "Review KYC", copy: "Approve identity and shops", icon: FileCheck, scope: "kyc" },
  { href: "/admin/users", label: "Users", copy: "Freeze, restore, permissions", icon: Users, scope: "users" },
  { href: "/admin/transactions", label: "Transactions", copy: "Reverse or mark status", icon: ArrowLeftRight, scope: "finance" },
  { href: "/admin/wallets", label: "Wallets", copy: "Credit or debit a ledger", icon: Wallet, scope: "finance" },
];

type Overview = {
  stats: AdminStats;
  recent: Array<{
    id: string;
    kind: string;
    amount: number;
    status: "success" | "failed" | "pending" | "cancelled" | "expired";
    counterparty: string;
    createdAt: string;
  }>;
  people: Array<{ id: string; name: string; lbpayId: string; avatar: string; status: string }>;
  supportUnread?: number;
  payouts?: { on: boolean; changedAt?: string };
  stuckPayouts?: Array<{
    id: string;
    kind: string;
    amount: number;
    fee: number;
    counterparty: string;
    railRef?: string;
    createdAt: string;
    user: { name: string; lbpayId: string } | null;
  }>;
  refundedPayouts?: Array<{
    id: string;
    kind: string;
    amount: number;
    fee: number;
    to: string;
    railRef?: string;
    createdAt: string;
    user: { name: string; lbpayId: string } | null;
  }>;
};

const n = (v: number) => v.toLocaleString("fr-FR");
const xaf = (v: number) => formatXAF(v, { withCurrency: false });
const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "0%");

const METRICS = {
  volume: { label: "Volume", format: (v: number) => `${xaf(v)} XAF` },
  count: { label: "Transactions", format: (v: number) => n(v) },
  signups: { label: "Sign-ups", format: (v: number) => n(v) },
  fees: { label: "Fees", format: (v: number) => `${xaf(v)} XAF` },
} as const;
type Metric = keyof typeof METRICS;

export default function AdminHome() {
  const session = useAdminSession();
  const scopes = session.data?.scopes ?? [];
  const [metric, setMetric] = useState<Metric>("volume");
  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/overview");
      if (!res.ok) throw new Error("Could not load overview");
      return res.json() as Promise<Overview>;
    },
    staleTime: 30_000,
  });
  const data = overview.data;
  const s = data?.stats;
  const series = s?.series ?? [];
  const total30 = series.reduce((sum, d) => sum + d[metric], 0);
  const last7 = series.slice(-7).reduce((sum, d) => sum + d[metric], 0);
  const prev7 = series.slice(-14, -7).reduce((sum, d) => sum + d[metric], 0);
  const change = prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : null;

  return (
    <div className="space-y-5">
      <AdminHeader
        title="Overview"
        copy="How LBPay is doing, in numbers."
        action={
          <button
            type="button"
            onClick={() => overview.refetch()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[13px] font-semibold text-ink"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", overview.isFetching && "animate-spin")} /> Refresh
          </button>
        }
      />

      <PayoutSwitch state={data?.payouts} owner={Boolean(session.data?.owner)} />

      {scopes.includes("finance") ? <ReconcileNow /> : null}

      {(data?.stuckPayouts || []).length ? (
        <AdminPanel
          title="Payouts stuck over 30 minutes"
          copy="The money is already taken from the wallet. Find each reference on the PayUnit dashboard: if it's paid, mark it success in Transactions; if PayUnit shows it failed, mark it failed and the wallet is refunded."
        >
          <div className="overflow-x-auto px-2 pb-2">
            <table className="w-full min-w-[560px] text-left text-sm">
              <tbody className="divide-y divide-line">
                {data!.stuckPayouts!.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-3 text-xs text-muted">{formatDate(r.createdAt)}</td>
                    <td className="py-2 pr-3 font-semibold">{r.user ? `${r.user.name} @${r.user.lbpayId}` : "Unknown"}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{r.counterparty}</td>
                    <td className="py-2 pr-3 text-right font-mono font-bold">{xaf(r.amount)}</td>
                    <td className="py-2 font-mono text-xs">
                      <Link href={`/admin/transactions?q=${encodeURIComponent(r.id)}`} className="underline">
                        {r.railRef || r.id}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>
      ) : null}

      {(data?.refundedPayouts || []).length ? (
        <AdminPanel
          title="Refunded payouts: check each one"
          copy="LBPay gave this money back because the payout was marked failed. Look up each reference on the PayUnit dashboard. If PayUnit shows it as paid, that person got the money twice."
        >
          <div className="overflow-x-auto px-2 pb-2">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="py-2 pr-3 font-semibold">When</th>
                  <th className="py-2 pr-3 font-semibold">Who</th>
                  <th className="py-2 pr-3 font-semibold">To</th>
                  <th className="py-2 pr-3 text-right font-semibold">Refunded</th>
                  <th className="py-2 font-semibold">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data!.refundedPayouts!.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-3 text-xs text-muted">{formatDate(r.createdAt)}</td>
                    <td className="py-2 pr-3 font-semibold">{r.user ? `${r.user.name} @${r.user.lbpayId}` : "Unknown"}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{r.to}</td>
                    <td className="py-2 pr-3 text-right font-mono font-bold">{xaf(r.amount + r.fee)}</td>
                    <td className="py-2 font-mono text-xs">{r.railRef || r.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminPanel>
      ) : null}

      {/* Needs attention */}
      {s && (s.users.pendingKyc > 0 || (data?.supportUnread ?? 0) > 0 || s.health.pending > 0) ? (
        <section className="flex flex-wrap gap-2">
          {s.users.pendingKyc > 0 && scopes.includes("kyc") ? (
            <Link href="/admin/kyc" className="rounded-full bg-gold-soft px-3.5 py-1.5 text-[13px] font-bold text-ink">
              {s.users.pendingKyc} KYC waiting →
            </Link>
          ) : null}
          {data?.supportUnread ? (
            <Link href="/admin/support" className="rounded-full bg-brand-soft px-3.5 py-1.5 text-[13px] font-bold text-brand-deep">
              {data.supportUnread} unread chats →
            </Link>
          ) : null}
          {s.health.pending > 0 && scopes.includes("finance") ? (
            <Link href="/admin/transactions" className="rounded-full bg-paper px-3.5 py-1.5 text-[13px] font-bold text-ink ring-1 ring-line">
              {s.health.pending} pending payments →
            </Link>
          ) : null}
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="col-span-2">
          <AdminStat
            tone="green"
            label="Money held"
            value={s ? xaf(s.money.float) : "…"}
            hint={s ? `XAF in wallets · ${xaf(s.money.savingsHeld)} more in ${s.money.livePots} savings pots` : undefined}
          />
        </div>
        <AdminStat
          label="Users"
          value={s ? n(s.users.total) : "…"}
          hint={s ? `+${s.users.new7} this week · +${s.users.new30} in 30 days` : undefined}
        />
        <AdminStat
          label="Active (30 days)"
          value={s ? n(s.users.active30) : "…"}
          hint={s ? `${pct(s.users.active30, s.users.total)} of all users moved money` : undefined}
        />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminStat label="Money in" value={s ? xaf(s.money.moneyIn) : "…"} hint="Deposits and collections" />
        <AdminStat label="Money out" value={s ? xaf(s.money.moneyOut) : "…"} hint="Withdrawals and payouts" />
        <AdminStat
          label="Wallet transfers"
          value={s ? xaf(s.money.transfers) : "…"}
          hint={s ? `${n(s.money.transferCount)} free transfers` : undefined}
        />
        <AdminStat
          label="Success rate"
          value={s ? (s.health.successRate == null ? "—" : `${s.health.successRate}%`) : "…"}
          hint={s ? `${n(s.health.failed)} failed · ${n(s.health.pending)} pending` : undefined}
        />
      </section>

      <AdminPanel>
        <div className="flex flex-wrap items-end justify-between gap-3 px-2 pt-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Last 30 days · {METRICS[metric].label}</p>
            <p className="mt-1 font-mono text-2xl font-black">{s ? METRICS[metric].format(total30) : "…"}</p>
            {change != null ? (
              <p className={cn("text-xs font-bold", change >= 0 ? "text-brand-deep" : "text-danger")}>
                {change >= 0 ? "▲" : "▼"} {Math.abs(change)}% vs the week before
              </p>
            ) : (
              <p className="text-xs text-muted">Not enough history to compare yet</p>
            )}
          </div>
          <div role="tablist" className="flex gap-1 rounded-full bg-paper p-1">
            {(Object.keys(METRICS) as Metric[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={metric === key}
                onClick={() => setMetric(key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-bold transition",
                  metric === key ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
                )}
              >
                {METRICS[key].label}
              </button>
            ))}
          </div>
        </div>
        <div className="px-2 pb-2 pt-4">
          <AdminBars data={series.map((d) => ({ label: d.day, value: d[metric] }))} format={METRICS[metric].format} />
        </div>
      </AdminPanel>

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <AdminPanel title="Revenue (estimate)" copy="Fees we kept, minus the MTN/Orange gateway cut.">
            <dl className="space-y-2 px-2 pb-2 text-sm">
              <Row label="Fees collected" value={s ? `${xaf(s.revenue.fees)} XAF` : "…"} />
              <Row label="Gateway cost (≈1.5% per crossing)" value={s ? `− ${xaf(s.revenue.gatewayCost)} XAF` : "…"} />
              <div className="flex justify-between gap-3 border-t border-line pt-2">
                <dt className="font-bold">Estimated margin</dt>
                <dd
                  className={cn(
                    "font-mono font-black",
                    s && s.revenue.estimatedMargin < 0 ? "text-danger" : "text-brand-deep",
                  )}
                >
                  {s ? `${xaf(s.revenue.estimatedMargin)} XAF` : "…"}
                </dd>
              </div>
            </dl>
          </AdminPanel>
        </div>
        <div className="lg:col-span-7">
          <AdminPanel title="Who uses LBPay" copy="Account mix across every user.">
            <div className="space-y-3 px-2 pb-3">
              {s
                ? [
                    { label: "Identity verified", value: s.users.verified },
                    { label: "Businesses", value: s.users.businesses },
                    { label: "Developers", value: s.users.developers },
                    { label: "Frozen", value: s.users.frozen, danger: true },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between text-[13px]">
                        <span className="font-semibold">{row.label}</span>
                        <span className="tabular text-muted">
                          {n(row.value)} · {pct(row.value, s.users.total)}
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper">
                        <div
                          className={cn("h-full rounded-full", row.danger ? "bg-danger" : "bg-brand")}
                          style={{ width: pct(row.value, s.users.total) }}
                        />
                      </div>
                    </div>
                  ))
                : null}
            </div>
          </AdminPanel>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        {shortcuts
          .filter((item) => scopes.includes(item.scope))
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[1.15rem] border border-line/70 bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)] transition hover:border-brand/30"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand-deep">
                <item.icon className="h-4 w-4" />
              </span>
              <p className="mt-4 text-sm font-bold text-ink">{item.label}</p>
              <p className="mt-1 text-xs text-muted">
                {item.href === "/admin/support" && data?.supportUnread ? `${data.supportUnread} waiting` : item.copy}
              </p>
            </Link>
          ))}
      </section>

      <div className="grid gap-3 lg:grid-cols-12">
        {scopes.includes("finance") ? (
          <div className="lg:col-span-7">
            <AdminPanel
              title="Recent activity"
              copy="Latest movements on the ledger."
              action={
                <Link href="/admin/transactions" className="text-sm font-bold text-ink/70">
                  See all
                </Link>
              }
            >
              {(data?.recent || []).length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">None</p>
              ) : (
                (data?.recent || []).map((tx) => (
                  <Link
                    key={tx.id}
                    href={`/admin/transactions?q=${encodeURIComponent(tx.id)}`}
                    className="flex items-center justify-between rounded-2xl px-3 py-3 transition hover:bg-paper"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{tx.counterparty}</p>
                      <p className="text-xs text-muted">
                        {kindTitle(tx.kind)} · {formatDate(tx.createdAt)}
                      </p>
                    </div>
                    <div className="ml-3 shrink-0 text-right">
                      <p className="font-mono text-sm font-black">{xaf(tx.amount)}</p>
                      <StatusBadge status={tx.status} />
                    </div>
                  </Link>
                ))
              )}
            </AdminPanel>
          </div>
        ) : null}
        <div className="space-y-3 lg:col-span-5">
          <AdminPanel title="Top accounts" copy="Most money moved, all time.">
            {(s?.topAccounts || []).length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">None</p>
            ) : (
              s!.topAccounts.map((acc, i) => (
                <div key={acc.id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper text-xs font-black">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{acc.name}</p>
                    <p className="text-xs text-muted">@{acc.lbpayId}</p>
                  </div>
                  <p className="font-mono text-sm font-black">{xaf(acc.volume)}</p>
                </div>
              ))
            )}
          </AdminPanel>
          {scopes.includes("users") ? (
            <AdminPanel
              title="Newest people"
              action={
                <Link href="/admin/users" className="text-sm font-bold text-ink/70">
                  See all
                </Link>
              }
            >
              {(data?.people || []).map((user) => (
                <Link
                  key={user.id}
                  href={`/admin/users?q=${encodeURIComponent(user.lbpayId)}`}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-paper"
                >
                  <AppImg src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover" width={36} height={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{user.name}</p>
                    <p className="text-xs text-muted">@{user.lbpayId}</p>
                  </div>
                </Link>
              ))}
            </AdminPanel>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ReconcileNow() {
  const client = useQueryClient();
  const [state, setState] = useState<"idle" | "busy" | string>("idle");
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[1.25rem] border border-line/80 bg-white px-4 py-3 text-sm">
      <span className="flex-1 text-muted">
        Pending payouts are checked with PayUnit when people open the app and every few minutes.
        {state !== "idle" && state !== "busy" ? <span className="ml-1 font-semibold text-ink">{state}</span> : null}
      </span>
      <button
        type="button"
        disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          const res = await fetch("/api/cron/reconcile", { method: "POST" }).catch(() => null);
          const data = res && res.ok ? ((await res.json()) as { checked: number; settled: number }) : null;
          setState(data ? `Checked ${data.checked}, settled ${data.settled}.` : "Couldn't check right now.");
          client.invalidateQueries({ queryKey: ["admin-overview"] });
        }}
        className="rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60"
      >
        {state === "busy" ? "Checking…" : "Check pending payouts now"}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono font-semibold">{value}</dd>
    </div>
  );
}
