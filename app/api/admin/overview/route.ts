import { NextResponse } from "next/server";
import { adminSnapshot, publicUser } from "@/lib/server/db";
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
  return NextResponse.json({
    stats,
    recent: hasAdminScope(auth.user, "finance") ? snap.transactions.slice(0, 8) : [],
    people: hasAdminScope(auth.user, "users")
      ? [...snap.users].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 6).map(publicUser)
      : [],
    supportUnread: canSupport ? await supportUnreadAdminCount() : 0,
  });
}
