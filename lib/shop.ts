import { formatXAF } from "./format";
import { isSafeProductImageUrl } from "./product-image";
import { payHandleUrl, payLinkUrl } from "./origin";

export type ShopProduct = {
  slug: string;
  title: string;
  amount: number | null;
  imageUrl?: string;
};

export type PublicShop = {
  name: string;
  handle: string;
  avatar?: string;
  businessName?: string;
  products: ShopProduct[];
};

export function publicProductsFromLinks(
  links: Array<{
    slug?: string;
    title?: string;
    amount?: number | null;
    status?: string;
    imageUrl?: string;
  }>,
): ShopProduct[] {
  return links
    .filter((item) => item.status !== "inactive" && String(item.slug || "").trim() && String(item.title || "").trim())
    .map((item) => {
      const imageUrl = String(item.imageUrl || "").trim();
      return {
        slug: String(item.slug).trim(),
        title: String(item.title).trim(),
        amount: item.amount && item.amount > 0 ? item.amount : null,
        imageUrl: isSafeProductImageUrl(imageUrl) ? imageUrl : undefined,
      };
    });
}

export function shopUrl(handle: string, origin = "") {
  return payHandleUrl(handle, origin);
}

export function productUrl(slug: string, origin = "") {
  return payLinkUrl(slug, origin);
}

export function shopShareText(shopName: string, url: string) {
  const name = shopName.trim() || "this shop";
  return `Shop ${name} on LBPay. Pay with MTN, Orange, or wallet.\n${url}`;
}

export function productShareText(title: string, amount: number | null, url: string) {
  const price = amount && amount > 0 ? ` · ${formatXAF(amount)}` : "";
  return `${title.trim() || "Product"}${price}\nPay on LBPay\n${url}`;
}

export function whatsappShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function telegramShareUrl(url: string, text: string) {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function facebookShareUrl(url: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}
