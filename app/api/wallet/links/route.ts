import { NextResponse } from "next/server";
import { addLink, listLinks } from "@/lib/server/db";
import { requireActiveUser } from "@/lib/server/guard";
import { slugify, uid } from "@/lib/format";

export async function GET() {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  return NextResponse.json({ links: await listLinks(auth.user.id) });
}

export async function POST(request: Request) {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  const link = await addLink({
    id: uid("lnk"),
    userId: auth.user.id,
    slug: `${slugify(title) || "pay"}-${uid("s").slice(-4)}`,
    title,
    amount: body.amount ? Number(body.amount) : null,
    status: "active",
    collected: 0,
    payments: 0,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true, link });
}
