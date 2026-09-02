import { NextResponse } from "next/server";
import { getWallet, listAllTx, listKyc, listUsers } from "@/lib/server/db";
import { supportUnreadAdminCount } from "@/lib/server/support";
import { requireAdmin } from "@/lib/server/guard";
import { publicUser } from "@/lib/server/db";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) return auth.error!;
  const users = await listUsers();
  const txs = await listAllTx();
  const kyc = await listKyc("pending");
  const supportUnread = await supportUnreadAdminCount();
  let volume = 0;
  let ledger = 0;
  for (const user of users) {
    ledger += (await getWallet(user.id)).balance;
  }
  for (const tx of txs) {
    if (tx.status === "success") volume += tx.amount;
  }
  return NextResponse.json({
    users: users.length,
    frozen: users.filter((u) => u.status === "frozen").length,
    admins: users.filter((u) => u.roles.includes("admin")).length,
    pendingKyc: kyc.length,
    transactions: txs.length,
    volume,
    ledger,
    recent: txs.slice(0, 8),
    people: users.slice(0, 8).map(publicUser),
    supportUnread,
  });
}
