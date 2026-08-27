import { NextResponse } from "next/server";
import { catchRoute } from "@/lib/server/api";
import { findUserById, getWallet, listKeys, listLinks, listTx, publicUser } from "@/lib/server/db";
import { readAdminSession, readSession } from "@/lib/server/session";
import { isAdmin } from "@/lib/roles";

export async function GET() {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ session: false });
    const user = await findUserById(session.userId);
    if (!user) return NextResponse.json({ session: false }, { status: 401 });
    const wallet = await getWallet(user.id);
    const transactions = await listTx(user.id);
    const keys = await listKeys(user.id);
    const links = await listLinks(user.id);
    const adminStep = isAdmin(user) ? Boolean((await readAdminSession())?.userId === user.id) : false;
    return NextResponse.json({
      session: true,
      user: publicUser(user),
      balance: wallet.balance,
      transactions,
      keys: keys.map((key) => ({
        id: key.id,
        env: key.env,
        publicKey: key.publicKey,
        secretMasked: key.secretMasked,
        createdAt: key.createdAt,
      })),
      links,
      adminStep,
    });
  } catch (error) {
    return catchRoute("me", error);
  }
}
