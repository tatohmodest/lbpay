import { NextResponse } from "next/server";
import { catchRoute } from "@/lib/server/api";
import { deleteAccountForUser, findUserById, getWallet, listKeys, listLinks, listTx, publicUser } from "@/lib/server/db";
import { supportUnreadForUser } from "@/lib/server/support";
import { listSavings } from "@/lib/server/savings";
import { publicTx } from "@/lib/tx";
import { clearSession, readAdminSession, readSession } from "@/lib/server/session";
import { requireUser } from "@/lib/server/guard";
import { isAdmin, shouldSkipAdminOtp } from "@/lib/roles";

export async function GET() {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ session: false });
    const user = await findUserById(session.userId);
    if (!user) return NextResponse.json({ session: false }, { status: 401 });
    const savings = await listSavings(user.id).catch(() => []);
    const wallet = await getWallet(user.id);
    const transactions = await listTx(user.id);
    const keys = await listKeys(user.id);
    const links = await listLinks(user.id);
    const adminStep = isAdmin(user)
      ? shouldSkipAdminOtp(user) || Boolean((await readAdminSession())?.userId === user.id)
      : false;
    const supportUnread = await supportUnreadForUser(user.id);
    return NextResponse.json({
      session: true,
      user: publicUser(user),
      balance: wallet.balance,
      transactions: transactions.map(publicTx),
      keys: keys.map((key) => ({
        id: key.id,
        env: key.env,
        publicKey: key.publicKey,
        secretMasked: key.secretMasked,
        createdAt: key.createdAt,
      })),
      links,
      savings,
      adminStep,
      supportUnread,
    });
  } catch (error) {
    return catchRoute("me", error);
  }
}

export async function DELETE() {
  try {
    const auth = await requireUser();
    if (auth.error || !auth.user) return auth.error!;
    const deleted = await deleteAccountForUser(auth.user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }
    await clearSession();
    return NextResponse.json({ ok: true, user: publicUser(deleted) });
  } catch (error) {
    return catchRoute("me-delete", error);
  }
}
