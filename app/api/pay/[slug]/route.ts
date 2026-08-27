import { NextResponse } from "next/server";
import { findLinkBySlug, findUserById } from "@/lib/server/db";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const link = await findLinkBySlug(slug);
  if (!link) return NextResponse.json({ error: "Link not found." }, { status: 404 });
  const owner = await findUserById(link.userId);
  return NextResponse.json({
    link,
    merchant: owner
      ? {
          name: owner.businessName || owner.name,
          lbpayId: owner.lbpayId,
          avatar: owner.avatar,
        }
      : null,
  });
}
