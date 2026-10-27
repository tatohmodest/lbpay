import { NextResponse } from "next/server";
import { adminSnapshot } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/guard";
import { dailyMoney, GATEWAY_RATE, summarize, topEarners, type Period } from "@/lib/server/admin-analytics";

const PERIODS: Period[] = ["today", "7d", "30d", "all"];

/** Money analytics: revenue is sensitive, so Finance permission is required. */
export async function GET() {
  const auth = await requireAdmin("finance");
  if (auth.error || !auth.user) return auth.error!;
  const snap = await adminSnapshot();
  const now = new Date();
  return NextResponse.json({
    periods: Object.fromEntries(PERIODS.map((p) => [p, summarize(snap.transactions, p, now)])),
    daily: dailyMoney(snap.transactions, 30, now),
    topEarners: topEarners(snap.transactions, snap.users),
    gatewayRate: GATEWAY_RATE,
    generatedAt: now.toISOString(),
  });
}
