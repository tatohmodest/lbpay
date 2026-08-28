import { NextResponse } from "next/server";
import { addLink, listLinks } from "@/lib/server/db";
import { requireActiveUser } from "@/lib/server/guard";
import { buildPaymentLink, parsePaymentLinkInput } from "@/lib/server/payment-links";

export async function GET() {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  return NextResponse.json({ links: await listLinks(auth.user.id) });
}

export async function POST(request: Request) {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parsePaymentLinkInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const link = await addLink(buildPaymentLink(auth.user.id, parsed.value));
  return NextResponse.json({ ok: true, link });
}
