import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/server/guard";
import { pinFailResponse, verifyUserPin } from "@/lib/server/pin";
import { depositToPlan, findPlan, publicPlan, settleSavings, updatePlanSettings, withdrawFromPlan } from "@/lib/server/savings";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const { id } = await params;
  await settleSavings(auth.user.id);
  const plan = await findPlan(auth.user.id, id);
  if (!plan) return NextResponse.json({ error: "Savings plan not found." }, { status: 404 });
  return NextResponse.json({ plan: publicPlan(plan) });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "settings") {
    try {
      const plan = await updatePlanSettings(auth.user.id, id, {
        autoSave: body.autoSave,
        penaltyRate: body.penaltyRate,
        name: body.name,
        emoji: body.emoji,
        target: body.target,
      });
      return NextResponse.json({ ok: true, plan });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update the plan." }, { status: 400 });
    }
  }

  const pinCheck = await verifyUserPin(auth.user, String(body.pin || ""));
  if (!pinCheck.ok) return pinFailResponse(pinCheck);

  try {
    if (action === "deposit") {
      const result = await depositToPlan(auth.user.id, id, Number(body.amount));
      return NextResponse.json({ ok: true, ...result });
    }
    if (action === "withdraw") {
      const result = await withdrawFromPlan(auth.user.id, id, body.amount === "all" ? "all" : Number(body.amount));
      return NextResponse.json({ ok: true, ...result });
    }
    if (action === "close") {
      const result = await withdrawFromPlan(auth.user.id, id, "all", true);
      return NextResponse.json({ ok: true, ...result });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const raw = error instanceof Error ? error.message : "";
    const message = /insufficient/i.test(raw) ? "Insufficient wallet balance. Add money or save a smaller amount." : raw || "Could not complete that.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
