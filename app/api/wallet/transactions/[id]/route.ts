import { NextResponse } from "next/server";
import { findTxById } from "@/lib/server/db";
import { requireUser } from "@/lib/server/guard";
import { publicTx } from "@/lib/tx";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (auth.error || !auth.user) return auth.error!;
  const { id } = await params;
  const tx = await findTxById(decodeURIComponent(id || ""));
  if (!tx || tx.userId !== auth.user.id) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }
  return NextResponse.json({ transaction: publicTx(tx) });
}
