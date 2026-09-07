import { NextResponse } from "next/server";
import { findLinkBySlug, findUserById } from "@/lib/server/db";
import { isSafeProductImageUrl } from "@/lib/product-image";
import { productPricing } from "@/lib/shop";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const link = await findLinkBySlug(slug);
  if (!link) return NextResponse.json({ error: "Link not found." }, { status: 404 });
  const owner = await findUserById(link.userId);
  const imageUrl = isSafeProductImageUrl(link.imageUrl || "") ? link.imageUrl : undefined;
  const { original } = productPricing(link.amount, link.compareAtAmount);
  return NextResponse.json({
    link: {
      slug: link.slug,
      title: link.title,
      amount: link.amount,
      compareAtAmount: original,
      description: link.description || undefined,
      imageUrl,
    },
    merchant: owner
      ? {
          name: owner.businessName || owner.name,
          lbpayId: owner.lbpayId,
          avatar: owner.avatar,
        }
      : null,
  });
}
