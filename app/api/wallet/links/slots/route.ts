import { NextResponse } from "next/server";
import { buyShopSlotPack } from "@/lib/server/db";
import { requireActiveUser } from "@/lib/server/guard";
import { pinFailResponse, verifyUserPin } from "@/lib/server/pin";

export async function POST(request: Request) {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const pinCheck = await verifyUserPin(auth.user, String(body.pin || ""));
  if (!pinCheck.ok) return pinFailResponse(pinCheck);
  try {
    const result = await buyShopSlotPack(auth.user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}
