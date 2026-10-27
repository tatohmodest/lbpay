import type { StoredTx, StoredUser } from "@/lib/server/db";

/** The gateway (PayUnit) takes about 1.5% each time money crosses MTN/Orange. */
export const GATEWAY_RATE = 0.015;

/** Money coming in from MTN/Orange/card: the gateway charges on what the customer paid (amount + fee). */
const IN = new Set(["deposit", "collection", "international_in"]);
/** Money going out to MTN/Orange: the gateway charges on what is paid out. */
const OUT = new Set(["withdraw", "payout", "international"]);
/** Kinds where the whole amount is LBPay's own income, not customer money moving. */
const INCOME_KINDS = new Set(["penalty", "shop_slots"]);
/** Mirrors and internal bookkeeping: never counted as volume. */
const NOT_VOLUME = new Set(["receive", "savings_in", "savings_out", "adjustment", "reversal", "penalty", "shop_slots"]);

export type Period = "today" | "7d" | "30d" | "all";

export type KindRow = {
  kind: string;
  count: number;
  users: number;
  volume: number;
  revenue: number;
  gatewayCost: number;
};

export type PeriodSummary = {
  gtv: number;
  transactions: number;
  activeUsers: number;
  avgTicket: number;
  lbpayRevenue: number;
  feeRevenue: number;
  otherIncome: number;
  gatewayCost: number;
  netMargin: number;
  takeRate: number;
  railVolume: number;
  walletVolume: number;
  savingsIn: number;
  failed: number;
  failedVolume: number;
  byKind: KindRow[];
  byMethod: Array<{ method: string; count: number; volume: number }>;
};

/** What the gateway earned on one successful transaction (estimate). */
export function gatewayCostOf(tx: Pick<StoredTx, "kind" | "amount" | "fee">) {
  const amount = tx.amount || 0;
  const fee = tx.fee || 0;
  if (IN.has(tx.kind)) return Math.round((amount + fee) * GATEWAY_RATE);
  if (OUT.has(tx.kind)) return Math.round(amount * GATEWAY_RATE);
  // A quick MoMo-to-MoMo transfer is collected (amount + fee) and paid out (amount).
  if (tx.kind === "cross_network") return Math.round((amount + fee) * GATEWAY_RATE + amount * GATEWAY_RATE);
  return 0;
}

/** What LBPay kept on one successful transaction. */
export function lbpayIncomeOf(tx: Pick<StoredTx, "kind" | "amount" | "fee">) {
  return INCOME_KINDS.has(tx.kind) ? tx.amount || 0 : tx.fee || 0;
}

function since(period: Period, now: Date) {
  if (period === "all") return 0;
  if (period === "today") {
    const d = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Douala" }).format(now);
    return +new Date(`${d}T00:00:00+01:00`);
  }
  return now.getTime() - (period === "7d" ? 7 : 30) * 86_400_000;
}

export function summarize(txs: StoredTx[], period: Period, now = new Date()): PeriodSummary {
  const from = since(period, now);
  const inPeriod = txs.filter((t) => +new Date(t.createdAt) >= from);
  const ok = inPeriod.filter((t) => t.status === "success");

  const kinds = new Map<string, KindRow & { ids: Set<string> }>();
  const methods = new Map<string, { method: string; count: number; volume: number }>();
  let gtv = 0;
  let feeRevenue = 0;
  let otherIncome = 0;
  let gatewayCost = 0;
  let railVolume = 0;
  let walletVolume = 0;
  let savingsIn = 0;
  let volumeCount = 0;
  const active = new Set<string>();

  for (const t of ok) {
    const amount = t.amount || 0;
    const income = lbpayIncomeOf(t);
    if (INCOME_KINDS.has(t.kind)) otherIncome += income;
    else feeRevenue += income;
    const cost = gatewayCostOf(t);
    gatewayCost += cost;
    if (t.kind === "savings_in") savingsIn += amount;
    if (t.kind !== "receive") active.add(t.userId);

    if (t.kind === "receive") continue; // the "send" side already counts it
    const row = kinds.get(t.kind) ?? { kind: t.kind, count: 0, users: 0, volume: 0, revenue: 0, gatewayCost: 0, ids: new Set() };
    row.count += 1;
    row.ids.add(t.userId);
    row.revenue += income;
    row.gatewayCost += cost;
    if (!NOT_VOLUME.has(t.kind)) row.volume += amount;
    kinds.set(t.kind, row);

    if (NOT_VOLUME.has(t.kind)) continue;
    gtv += amount;
    volumeCount += 1;
    if (IN.has(t.kind) || OUT.has(t.kind) || t.kind === "cross_network") railVolume += amount;
    else walletVolume += amount;
    const method = t.method || "wallet";
    const m = methods.get(method) ?? { method, count: 0, volume: 0 };
    m.count += 1;
    m.volume += amount;
    methods.set(method, m);
  }

  const failedRows = inPeriod.filter((t) => t.status === "failed" || t.status === "cancelled");
  const lbpayRevenue = feeRevenue + otherIncome;
  return {
    gtv,
    transactions: volumeCount,
    activeUsers: active.size,
    avgTicket: volumeCount ? Math.round(gtv / volumeCount) : 0,
    lbpayRevenue,
    feeRevenue,
    otherIncome,
    gatewayCost,
    netMargin: lbpayRevenue - gatewayCost,
    takeRate: gtv ? lbpayRevenue / gtv : 0,
    railVolume,
    walletVolume,
    savingsIn,
    failed: failedRows.length,
    failedVolume: failedRows.reduce((s, t) => s + (t.amount || 0), 0),
    byKind: [...kinds.values()]
      .map(({ ids, ...row }) => ({ ...row, users: ids.size }))
      .sort((a, b) => b.count - a.count),
    byMethod: [...methods.values()].sort((a, b) => b.volume - a.volume),
  };
}

/** Daily money series for the last `days` days (Douala time). */
export function dailyMoney(txs: StoredTx[], days = 30, now = new Date()) {
  const key = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Douala" }).format(d);
  const rows: Array<{ day: string; gtv: number; revenue: number; gatewayCost: number; count: number }> = [];
  const index = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const day = key(new Date(now.getTime() - i * 86_400_000));
    index.set(day, rows.length);
    rows.push({ day, gtv: 0, revenue: 0, gatewayCost: 0, count: 0 });
  }
  for (const t of txs) {
    if (t.status !== "success" || t.kind === "receive") continue;
    const i = index.get(key(new Date(t.createdAt)));
    if (i == null) continue;
    rows[i].revenue += lbpayIncomeOf(t);
    rows[i].gatewayCost += gatewayCostOf(t);
    if (!NOT_VOLUME.has(t.kind)) {
      rows[i].gtv += t.amount || 0;
      rows[i].count += 1;
    }
  }
  return rows;
}

/** Who brings in the most fees. */
export function topEarners(txs: StoredTx[], users: StoredUser[], limit = 8) {
  const byUser = new Map<string, { revenue: number; volume: number; count: number }>();
  for (const t of txs) {
    if (t.status !== "success" || t.kind === "receive") continue;
    const row = byUser.get(t.userId) ?? { revenue: 0, volume: 0, count: 0 };
    row.revenue += lbpayIncomeOf(t);
    if (!NOT_VOLUME.has(t.kind)) row.volume += t.amount || 0;
    row.count += 1;
    byUser.set(t.userId, row);
  }
  const names = new Map(users.map((u) => [u.id, u] as const));
  return [...byUser.entries()]
    .filter(([, r]) => r.revenue > 0)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, limit)
    .map(([id, r]) => ({ id, name: names.get(id)?.name || "Unknown", lbpayId: names.get(id)?.lbpayId || "", ...r }));
}
