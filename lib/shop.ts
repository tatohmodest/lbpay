import { formatXAF } from "./format";
import { isSafeProductImageUrl } from "./product-image";
import { payHandleUrl, payLinkUrl } from "./origin";

export const PRODUCT_DESCRIPTION_MAX = 800;

export type ShopProduct = {
  slug: string;
  title: string;
  amount: number | null;
  compareAtAmount?: number | null;
  description?: string;
  imageUrl?: string;
};

export function productPricing(amount?: number | null, compareAtAmount?: number | null) {
  const price = amount && amount > 0 ? amount : null;
  const original = price && compareAtAmount && compareAtAmount > price ? compareAtAmount : null;
  const percentOff = original && price ? Math.round(((original - price) / original) * 100) : null;
  return { price, original, onSale: Boolean(original), percentOff };
}

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
    compareAtAmount?: number | null;
    description?: string;
    status?: string;
    imageUrl?: string;
  }>,
): ShopProduct[] {
  return links
    .filter((item) => item.status !== "inactive" && String(item.slug || "").trim() && String(item.title || "").trim())
    .map((item) => {
      const imageUrl = String(item.imageUrl || "").trim();
      const description = String(item.description || "").trim();
      const amount = item.amount && item.amount > 0 ? item.amount : null;
      const compareAt = item.compareAtAmount && amount && item.compareAtAmount > amount ? item.compareAtAmount : null;
      const product: ShopProduct = {
        slug: String(item.slug).trim(),
        title: String(item.title).trim(),
        amount,
      };
      if (compareAt) product.compareAtAmount = compareAt;
      if (description) product.description = description;
      if (isSafeProductImageUrl(imageUrl)) product.imageUrl = imageUrl;
      return product;
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

export function productExcerpt(description?: string, max = 88) {
  const text = String(description || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "").trimEnd()}…`;
}
