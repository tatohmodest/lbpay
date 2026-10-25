import { NextResponse } from "next/server";
import { adminSnapshot, payoutSwitch, publicUser } from "@/lib/server/db";
import { buildAdminStats } from "@/lib/server/admin-stats";
import { supportUnreadAdminCount } from "@/lib/server/support";
import { requireAdmin } from "@/lib/server/guard";
import { hasAdminScope } from "@/lib/roles";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) return auth.error!;
  const snap = await adminSnapshot();
  const stats = buildAdminStats({
    users: snap.users,
    balances: snap.balances,
    transactions: snap.transactions,
    savings: snap.savings,
    pendingKyc: snap.kyc.filter((k) => k.status === "pending").length,
  });
  const canSupport = hasAdminScope(auth.user, "support");
  const canFinance = hasAdminScope(auth.user, "finance");
  const names = new Map(snap.users.map((u) => [u.id, u] as const));
  // Payouts we gave back to the wallet. Each one should match a FAILED payout on the
  // gateway dashboard; if the gateway shows it as paid, that person was paid twice.
  const refundedPayouts = canFinance
    ? snap.transactions
        .filter((t) => ["withdraw", "payout", "international"].includes(t.kind) && t.meta?.refundApplied)
        .slice(0, 50)
        .map((t) => ({
          id: t.id,
          kind: t.kind,
          amount: t.amount,
          fee: t.fee || 0,
          to: t.counterparty,
          railRef: t.railRef,
          createdAt: t.createdAt,
          user: names.get(t.userId) ? { name: names.get(t.userId)!.name, lbpayId: names.get(t.userId)!.lbpayId } : null,
        }))
    : [];
  return NextResponse.json({
    stats,
    recent: hasAdminScope(auth.user, "finance") ? snap.transactions.slice(0, 8) : [],
    people: hasAdminScope(auth.user, "users")
      ? [...snap.users].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6).map(publicUser)
      : [],
    supportUnread: canSupport ? await supportUnreadAdminCount() : 0,
    refundedPayouts,
    payouts: await payoutSwitch(),
  });
}
