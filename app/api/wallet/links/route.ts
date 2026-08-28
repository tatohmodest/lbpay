import { NextResponse } from "next/server";
import { addLink, listLinks, updateLink, deleteLink } from "@/lib/server/db";
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

export async function PATCH(request: Request) {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || body.slug || "").trim();
  if (!id) return NextResponse.json({ error: "Missing id or slug" }, { status: 400 });
  const parsed = parsePaymentLinkInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const updated = await updateLink(auth.user.id, id, {
      title: parsed.value.title,
      amount: parsed.value.amount,
      imageUrl: parsed.value.imageUrl,
      template: parsed.value.template,
    } as any);
    return NextResponse.json({ ok: true, link: updated });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || body.slug || "").trim();
  if (!id) return NextResponse.json({ error: "Missing id or slug" }, { status: 400 });
  try {
    const ok = await deleteLink(auth.user.id, id);
    return NextResponse.json({ ok });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}
