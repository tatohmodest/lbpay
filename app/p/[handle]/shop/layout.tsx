import type { Metadata } from "next";
import { findUserByHandle, listLinks } from "@/lib/server/db";
import { shareImage, shareMetadata, shareOrigin } from "@/lib/server/share-meta";
import { publicProductsFromLinks } from "@/lib/shop";
import { formatXAF } from "@/lib/format";
import { DEFAULT_AVATAR, resolveAvatar } from "@/lib/avatar";

type Props = { params: Promise<{ handle: string }>; children: React.ReactNode };

/** Preview for shop links: /p/@handle/shop. Leads with the first product photo. */
export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { handle: raw } = await params;
  const handle = decodeURIComponent(raw || "").replace(/^@/, "").trim().toLowerCase();
  const user = handle ? await findUserByHandle(handle) : null;
  if (!user) return { title: "Shop on LBPay", robots: { index: false, follow: false } };

  const name = user.businessName || user.name;
  const products = publicProductsFromLinks(await listLinks(user.id));
  const origin = await shareOrigin();
  const prices = products.map((p) => p.amount).filter((n): n is number => typeof n === "number" && n > 0);
  const from = prices.length ? ` From ${formatXAF(Math.min(...prices))}.` : "";
  const highlights = products
    .slice(0, 3)
    .map((p) => p.title)
    .join(", ");
  const cover = products.find((p) => p.imageUrl);
  const avatar = resolveAvatar(user.avatar);

  const image = cover
    ? shareImage(cover.imageUrl, origin, {
        alt: `${name} on LBPay`,
        shape: "wide",
        fallbackRoute: `/api/share-image/product/${encodeURIComponent(cover.slug)}`,
      })
    : avatar && avatar !== DEFAULT_AVATAR
      ? shareImage(avatar, origin, {
          alt: name,
          shape: "square",
          fallbackRoute: `/api/share-image/avatar/${encodeURIComponent(user.lbpayId)}`,
        })
      : null;

  return shareMetadata({
    title: `${name} · Shop on LBPay`,
    description: products.length
      ? `${products.length} product${products.length === 1 ? "" : "s"}${highlights ? `: ${highlights}` : ""}.${from} Pay with MTN MoMo, Orange Money or LBPay wallet.`
      : `Shop ${name} on LBPay. Pay with MTN MoMo, Orange Money or LBPay wallet.`,
    path: `/p/${encodeURIComponent(user.lbpayId)}/shop`,
    origin,
    image,
  });
}

export default function ShopLayout({ children }: Props) {
  return children;
}
