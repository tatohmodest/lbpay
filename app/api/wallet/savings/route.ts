import { NextResponse } from "next/server";
import { getWallet } from "@/lib/server/db";
import { requireActiveUser } from "@/lib/server/guard";
import { createSavingsPlan, listSavings } from "@/lib/server/savings";
import { pinFailResponse, verifyUserPin } from "@/lib/server/pin";
import type { SavingsFrequency } from "@/lib/types";

export async function GET() {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const savings = await listSavings(auth.user.id);
  const wallet = await getWallet(auth.user.id);
  return NextResponse.json({ savings, balance: wallet.balance });
}

export async function POST(request: Request) {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const pinCheck = await verifyUserPin(auth.user, String(body.pin || ""));
  if (!pinCheck.ok) return pinFailResponse(pinCheck);
  try {
    const plan = await createSavingsPlan(auth.user.id, {
      name: String(body.name || ""),
      emoji: body.emoji ? String(body.emoji) : undefined,
      frequency: String(body.frequency) as SavingsFrequency,
      amount: Number(body.amount),
      target: body.target ? Number(body.target) : null,
      penaltyRate: body.penaltyRate != null ? Number(body.penaltyRate) : undefined,
      autoSave: Boolean(body.autoSave),
    });
    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create the plan." }, { status: 400 });
  }
}
