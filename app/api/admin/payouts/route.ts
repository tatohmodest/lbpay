import { NextResponse } from "next/server";
import { payoutSwitch, setPayoutsOn } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/guard";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) return auth.error!;
  return NextResponse.json(await payoutSwitch());
}

/** Turning payouts off is allowed for any finance admin; turning them back on is owner-only. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const on = body.on === true;
  const auth = await requireAdmin(on ? "owner" : "finance");
  if (auth.error || !auth.user) return auth.error!;
  await setPayoutsOn(on, auth.user.id);
  return NextResponse.json(await payoutSwitch());
}
