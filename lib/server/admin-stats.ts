import type { StoredSavingsPlan, StoredTx, StoredUser } from "@/lib/server/db";

/** Gateway cost on money entering or leaving through MTN/Orange (see lib/fees.ts). */
const GATEWAY_RATE = 0.015;

const MONEY_IN = new Set(["deposit", "collection", "international_in"]);
const MONEY_OUT = new Set(["withdraw", "payout", "cross_network", "international"]);

function dayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Douala" }).format(new Date(iso));
}

/**
 * Platform analytics from one snapshot. Internal transfers are counted once
 * (the "send" side), never twice. Revenue is an estimate: fees collected minus
 * the gateway's cut on money that crossed MTN/Orange.
 */
export function buildAdminStats(input: {
  users: StoredUser[];
  balances: Map<string, number>;
  transactions: StoredTx[];
  savings: StoredSavingsPlan[];
  pendingKyc: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const day = 86_400_000;
  const since = (days: number) => now.getTime() - days * day;
  const txs = input.transactions;
  const ok = txs.filter((t) => t.status === "success");

  const users = input.users;
  const newUsers = (days: number) => users.filter((u) => +new Date(u.createdAt) >= since(days)).length;
  const activeIds = new Set(txs.filter((t) => +new Date(t.createdAt) >= since(30)).map((t) => t.userId));

  const sum = (rows: StoredTx[]) => rows.reduce((s, t) => s + (t.amount || 0), 0);
  const moneyIn = ok.filter((t) => MONEY_IN.has(t.kind));
  const moneyOut = ok.filter((t) => MONEY_OUT.has(t.kind));
  const transfers = ok.filter((t) => t.kind === "send");
  const fees = ok.reduce((s, t) => s + (t.fee || 0), 0);
  // A quick MoMo-to-MoMo transfer is collected and paid out: it crosses the gateway twice.
  const railVolume = sum(moneyIn) + sum(moneyOut) + sum(ok.filter((t) => t.kind === "cross_network"));
  const gatewayCost = Math.round(railVolume * GATEWAY_RATE);
  const settled = txs.filter((t) => t.status === "success" || t.status === "failed");

  // 30-day series
  const series: Array<{ day: string; volume: number; count: number; signups: number; fees: number }> = [];
  const index = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const key = dayKey(new Date(now.getTime() - i * day).toISOString());
    index.set(key, series.length);
    series.push({ day: key, volume: 0, count: 0, signups: 0, fees: 0 });
  }
  for (const t of ok) {
    if (t.kind === "receive" || t.kind === "savings_out") continue; // counted on the other side
    const i = index.get(dayKey(t.createdAt));
    if (i == null) continue;
    series[i].volume += t.amount || 0;
    series[i].count += 1;
    series[i].fees += t.fee || 0;
  }
  for (const u of users) {
    const i = index.get(dayKey(u.createdAt));
    if (i != null) series[i].signups += 1;
  }

  const byUser = new Map<string, number>();
  for (const t of ok) {
    if (t.kind === "receive") continue;
    byUser.set(t.userId, (byUser.get(t.userId) || 0) + (t.amount || 0));
  }
  const nameOf = new Map(users.map((u) => [u.id, u]));
  const topAccounts = [...byUser.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, volume]) => ({ id, volume, name: nameOf.get(id)?.name || "Unknown", lbpayId: nameOf.get(id)?.lbpayId || "" }));

  const livePots = input.savings.filter((p) => p.status === "active" || p.status === "paused");

  return {
    users: {
      total: users.length,
      new7: newUsers(7),
      new30: newUsers(30),
      active30: activeIds.size,
      frozen: users.filter((u) => u.status === "frozen").length,
      verified: users.filter((u) => u.kyc?.personal === "verified").length,
      businesses: users.filter((u) => u.roles.includes("business")).length,
      developers: users.filter((u) => u.roles.includes("developer")).length,
      admins: users.filter((u) => u.roles.includes("admin")).length,
      pendingKyc: input.pendingKyc,
    },
    money: {
      float: [...input.balances.values()].reduce((s, b) => s + b, 0),
      moneyIn: sum(moneyIn),
      moneyOut: sum(moneyOut),
      transfers: sum(transfers),
      transferCount: transfers.length,
      savingsHeld: livePots.reduce((s, p) => s + (p.balance || 0), 0),
      livePots: livePots.length,
    },
    revenue: {
      fees,
      gatewayCost,
      estimatedMargin: fees - gatewayCost,
    },
    health: {
      total: txs.length,
      pending: txs.filter((t) => t.status === "pending").length,
      failed: txs.filter((t) => t.status === "failed").length,
      successRate: settled.length ? Math.round((settled.filter((t) => t.status === "success").length / settled.length) * 1000) / 10 : null,
    },
    series,
    topAccounts,
  };
}

export type AdminStats = ReturnType<typeof buildAdminStats>;
