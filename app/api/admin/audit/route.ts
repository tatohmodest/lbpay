import { NextResponse } from "next/server";
import { listAudit } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/guard";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) return auth.error!;
  return NextResponse.json({ audit: await listAudit() });
}
