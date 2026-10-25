import { NextResponse } from "next/server";
import { reconcilePayouts } from "@/lib/server/reconcile";
import { requireAdmin } from "@/lib/server/guard";

/**
 * Settle pending payouts. Called every few minutes by the GitHub schedule
 * (header x-cron-secret = CRON_SECRET), or by a finance admin from the dashboard.
 */
async function allowed(request: Request) {
  const secret = String(process.env.CRON_SECRET || "").trim();
  if (secret && request.headers.get("x-cron-secret") === secret) return true;
  const admin = await requireAdmin("finance");
  return !admin.error;
}

export async function POST(request: Request) {
  if (!(await allowed(request))) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  return NextResponse.json(await reconcilePayouts({ limit: 40 }));
}
