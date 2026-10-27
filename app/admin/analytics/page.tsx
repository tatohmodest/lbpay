"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { AdminHeader, AdminPanel, AdminStat } from "@/components/admin/ui";
import { AdminBars } from "@/components/admin/bars";
import { formatXAF } from "@/lib/format";
import { kindTitle, methodLabel } from "@/lib/tx";
import { cn } from "@/lib/cn";
import type { PeriodSummary } from "@/lib/server/admin-analytics";

type Period = "today" | "7d" | "30d" | "all";
type Data = {
  periods: Record<Period, PeriodSummary>;
  daily: Array<{ day: string; gtv: number; revenue: number; gatewayCost: number; count: number }>;
  topEarners: Array<{ id: string; name: string; lbpayId: string; revenue: number; volume: number; count: number }>;
  gatewayRate: number;
  generatedAt: string;
};

const PERIOD_LABEL: Record<Period, string> = { today: "Today", "7d": "7 days", "30d": "30 days", all: "All time" };
const CHART = {
  gtv: { label: "Volume (GTV)", pick: (d: Data["daily"][number]) => d.gtv },
  revenue: { label: "LBPay earned", pick: (d: Data["daily"][number]) => d.revenue },
  gatewayCost: { label: "PayUnit earned", pick: (d: Data["daily"][number]) => d.gatewayCost },
  count: { label: "Transactions", pick: (d: Data["daily"][number]) => d.count },
} as const;
type ChartKey = keyof typeof CHART;

const xaf = (v: number) => formatXAF(Math.round(v), { withCurrency: false });
const n = (v: number) => v.toLocaleString("fr-FR");
const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [chart, setChart] = useState<ChartKey>("gtv");
  const q = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load analytics.");
      return data as Data;
    },
    staleTime: 60_000,
  });
  const s = q.data?.periods[period];
  const daily = q.data?.daily ?? [];
  const chartTotal = daily.reduce((sum, d) => sum + CHART[chart].pick(d), 0);
  const maxKind = Math.max(1, ...(s?.byKind ?? []).map((k) => k.count));
  const totalKindCount = (s?.byKind ?? []).reduce((sum, k) => sum + k.count, 0);
  const methodTotal = (s?.byMethod ?? []).reduce((sum, m) => sum + m.volume, 0);
  const money = chart !== "count";

  return (
    <div className="space-y-5">
      <AdminHeader
        title="Analytics"
        copy="Volume, what LBPay earns, what PayUnit takes, and what people do most."
        action={
          <button
            type="button"
            onClick={() => q.refetch()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-[13px] font-semibold text-ink"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", q.isFetching && "animate-spin")} /> Refresh
          </button>
        }
      />

      <div role="tablist" className="flex w-fit gap-1 rounded-full bg-white p-1 ring-1 ring-line">
        {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={period === p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] font-bold transition",
              period === p ? "bg-ink text-white" : "text-muted hover:text-ink",
            )}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      {q.isError ? (
        <AdminPanel>
          <p className="px-4 py-8 text-center text-sm text-danger">{(q.error as Error).message}</p>
        </AdminPanel>
      ) : null}

      {/* Headline money */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="col-span-2">
          <AdminStat
            tone="green"
            label="Gross transaction volume"
            value={s ? `${xaf(s.gtv)} XAF` : "…"}
            hint={s ? `${n(s.transactions)} payments · ${n(s.activeUsers)} people · average ${xaf(s.avgTicket)} XAF` : undefined}
          />
        </div>
        <AdminStat
          label="LBPay earned"
          value={s ? xaf(s.lbpayRevenue) : "…"}
          hint={s ? `${pct(s.takeRate, 2)} of volume` : undefined}
        />
        <AdminStat
          label="PayUnit earned (est.)"
          value={s ? xaf(s.gatewayCost) : "…"}
          hint={q.data ? `≈${pct(q.data.gatewayRate)} each time money crosses MTN/Orange` : undefined}
        />
      </section>

      <div className="grid gap-3 lg:grid-cols-12">
        {/* Where the money goes */}
        <div className="lg:col-span-5">
          <AdminPanel title="Where the fees go" copy={`${PERIOD_LABEL[period]} · gateway cost is an estimate.`}>
            <dl className="space-y-2.5 px-2 pb-3 text-sm">
              <Line label="Fees customers paid" value={s ? s.feeRevenue : null} />
              <Line label="Savings penalties and shop slots" value={s ? s.otherIncome : null} />
              <Line label="LBPay income" value={s ? s.lbpayRevenue : null} strong />
              <Line label="Paid to PayUnit" value={s ? -s.gatewayCost : null} danger />
              <div className="flex items-center justify-between gap-3 border-t border-line pt-2.5">
                <dt className="font-black">LBPay keeps</dt>
                <dd className={cn("font-mono text-lg font-black", s && s.netMargin < 0 ? "text-danger" : "text-brand-deep")}>
                  {s ? `${xaf(s.netMargin)} XAF` : "…"}
                </dd>
              </div>
              {s && s.lbpayRevenue + s.gatewayCost > 0 ? (
                <div className="pt-1">
                  <div className="flex h-3 overflow-hidden rounded-full bg-paper">
                    <div className="bg-brand" style={{ width: pct(Math.max(0, s.netMargin) / (Math.max(0, s.netMargin) + s.gatewayCost), 2) }} />
                    <div className="bg-gold" style={{ width: pct(s.gatewayCost / (Math.max(0, s.netMargin) + s.gatewayCost), 2) }} />
                  </div>
                  <div className="mt-1.5 flex gap-4 text-[11px] text-muted">
                    <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-brand" /> LBPay keeps</span>
                    <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-gold" /> PayUnit</span>
                  </div>
                </div>
              ) : null}
            </dl>
          </AdminPanel>
        </div>

        {/* Volume split */}
        <div className="lg:col-span-7">
          <AdminPanel title="How the volume moved" copy={PERIOD_LABEL[period]}>
            <div className="grid grid-cols-3 gap-2 px-2 pb-3">
              <Mini label="Through MTN/Orange" value={s ? xaf(s.railVolume) : "…"} hint="PayUnit takes a cut" />
              <Mini label="Inside LBPay" value={s ? xaf(s.walletVolume) : "…"} hint="Free, no gateway" />
              <Mini label="Put into savings" value={s ? xaf(s.savingsIn) : "…"} hint="Held in pots" />
            </div>
            <div className="space-y-2 px-2 pb-3">
              {(s?.byMethod ?? []).map((m) => (
                <div key={m.method}>
                  <div className="flex justify-between text-[13px]">
                    <span className="font-semibold">{methodLabel(m.method)}</span>
                    <span className="tabular text-muted">
                      {xaf(m.volume)} XAF · {pct(methodTotal ? m.volume / methodTotal : 0, 0)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper">
                    <div className="h-full rounded-full bg-brand" style={{ width: pct(methodTotal ? m.volume / methodTotal : 0, 2) }} />
                  </div>
                </div>
              ))}
              {s && s.failed ? (
                <p className="pt-1 text-xs text-muted">
                  {n(s.failed)} failed or cancelled ({xaf(s.failedVolume)} XAF) not counted.
                </p>
              ) : null}
            </div>
          </AdminPanel>
        </div>
      </div>

      {/* Daily chart */}
      <AdminPanel>
        <div className="flex flex-wrap items-end justify-between gap-3 px-2 pt-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Last 30 days · {CHART[chart].label}</p>
            <p className="mt-1 font-mono text-2xl font-black">
              {q.data ? (money ? `${xaf(chartTotal)} XAF` : n(chartTotal)) : "…"}
            </p>
          </div>
          <div role="tablist" className="flex flex-wrap gap-1 rounded-full bg-paper p-1">
            {(Object.keys(CHART) as ChartKey[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={chart === key}
                onClick={() => setChart(key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-bold transition",
                  chart === key ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
                )}
              >
                {CHART[key].label}
              </button>
            ))}
          </div>
        </div>
        <div className="px-2 pb-2 pt-4">
          <AdminBars
            data={daily.map((d) => ({ label: d.day, value: CHART[chart].pick(d) }))}
            format={(v) => (money ? `${xaf(v)} XAF` : n(v))}
          />
        </div>
      </AdminPanel>

      {/* What people do */}
      <AdminPanel title="What people do most" copy={`${PERIOD_LABEL[period]} · by number of times, with people, volume and what each earns.`}>
        <div className="overflow-x-auto px-2 pb-2">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="py-2 pr-3 font-semibold">Action</th>
                <th className="w-[30%] py-2 pr-3 font-semibold">Times</th>
                <th className="py-2 pr-3 text-right font-semibold">People</th>
                <th className="py-2 pr-3 text-right font-semibold">Volume</th>
                <th className="py-2 pr-3 text-right font-semibold">LBPay earned</th>
                <th className="py-2 text-right font-semibold">PayUnit (est.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(s?.byKind ?? []).map((k) => (
                <tr key={k.kind}>
                  <td className="py-2.5 pr-3 font-semibold">{kindTitle(k.kind)}</td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                        <div className="h-full rounded-full bg-brand" style={{ width: pct(k.count / maxKind, 2) }} />
                      </div>
                      <span className="tabular w-20 shrink-0 text-right text-xs text-muted">
                        {n(k.count)} · {pct(totalKindCount ? k.count / totalKindCount : 0, 0)}
                      </span>
                    </div>
                  </td>
                  <td className="tabular py-2.5 pr-3 text-right">{n(k.users)}</td>
                  <td className="tabular py-2.5 pr-3 text-right font-mono">{k.volume ? xaf(k.volume) : "—"}</td>
                  <td className="tabular py-2.5 pr-3 text-right font-mono font-bold text-brand-deep">{k.revenue ? xaf(k.revenue) : "—"}</td>
                  <td className="tabular py-2.5 text-right font-mono text-muted">{k.gatewayCost ? xaf(k.gatewayCost) : "—"}</td>
                </tr>
              ))}
              {s && !s.byKind.length ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">No activity in this period.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </AdminPanel>

      <AdminPanel title="Who brings in the most" copy="All time, by fees LBPay earned from them.">
        {(q.data?.topEarners ?? []).length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">None yet</p>
        ) : (
          q.data!.topEarners.map((u, i) => (
            <div key={u.id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper text-xs font-black">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{u.name}</p>
                <p className="text-xs text-muted">
                  @{u.lbpayId} · {n(u.count)} transactions · {xaf(u.volume)} XAF moved
                </p>
              </div>
              <p className="font-mono text-sm font-black text-brand-deep">{xaf(u.revenue)}</p>
            </div>
          ))
        )}
      </AdminPanel>

      <p className="text-center text-[11px] text-muted">
        PayUnit&apos;s share is estimated at {q.data ? pct(q.data.gatewayRate) : "1.5%"} per crossing (deposits on the amount paid,
        payouts on the amount sent, quick transfers twice). Compare with the PayUnit statement for exact figures.
      </p>
    </div>
  );
}

function Line({ label, value, strong, danger }: { label: string; value: number | null; strong?: boolean; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={strong ? "font-bold" : "text-muted"}>{label}</dt>
      <dd className={cn("font-mono", strong ? "font-black" : "font-semibold", danger && "text-danger")}>
        {value == null ? "…" : `${value < 0 ? "− " : ""}${xaf(Math.abs(value))} XAF`}
      </dd>
    </div>
  );
}

function Mini({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl bg-paper p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 truncate font-mono text-base font-black">{value}</p>
      <p className="text-[11px] text-muted">{hint}</p>
    </div>
  );
}
