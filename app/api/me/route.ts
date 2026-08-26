import { NextResponse } from "next/server";
import { findUserById, getWallet, listTx, publicUser } from "@/lib/server/db";
import { readSession } from "@/lib/server/session";

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ session: false });
  const user = await findUserById(session.userId);
  if (!user) return NextResponse.json({ session: false }, { status: 401 });
  const wallet = await getWallet(user.id);
  const transactions = await listTx(user.id);
  return NextResponse.json({
    session: true,
    user: publicUser(user),
    balance: wallet.balance,
    transactions,
  });
}
