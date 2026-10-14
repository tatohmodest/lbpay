import { mediaKey, mediaSrc } from "@/lib/media";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

/**
 * Link previews (WhatsApp, Facebook, LinkedIn, TikTok, X, iMessage) are built
 * from Open Graph tags. Crawlers never run our JavaScript, so every shareable
 * page must emit them from the server, with absolute URLs.
 */

/** The origin the link was actually opened on, so previews never point at the wrong domain. */
export async function shareOrigin() {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    if (host && !host.startsWith("localhost") && !host.startsWith("127.")) {
      // Previews require https; never trust a missing or downgraded proto header.
      return `https://${host}`.replace(/\/$/, "");
    }
  } catch {
    /* outside a request */
  }
  return SITE_URL;
}

type ShareImage = { url: string; width?: number; height?: number; alt?: string };

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/**
 * Turn a stored image (Cloudinary, R2, local path, or inline data URL) into
 * something every network accepts: absolute https, a sane size, and JPEG.
 * `fallbackRoute` serves inline data-URL images as real files.
 */
export function shareImage(
  raw: string | undefined,
  origin: string,
  opts: { alt: string; shape: "wide" | "square"; fallbackRoute?: string },
): ShareImage | null {
  const url = String(raw || "").trim();
  if (!url) return null;
  const [w, h] = opts.shape === "wide" ? [1200, 630] : [600, 600];

  const cloud = url.match(CLOUDINARY_UPLOAD);
  if (cloud) {
    return {
      url: `${cloud[1]}c_fill,g_auto,w_${w},h_${h},q_auto,f_jpg/${cloud[2]}`,
      width: w,
      height: h,
      alt: opts.alt,
    };
  }
  // Our R2 files are served by LBPay itself (the bucket has no reliable public address).
  // KYC photos are private and never used as previews.
  const key = mediaKey(url);
  if (key) return key.startsWith("kyc/") ? null : { url: `${origin}${mediaSrc(url)}`, alt: opts.alt };
  if (url.startsWith("data:image/")) {
    return opts.fallbackRoute ? { url: `${origin}${opts.fallbackRoute}`, alt: opts.alt } : null;
  }
  if (url.startsWith("https://")) return { url, alt: opts.alt };
  if (url.startsWith("/")) return { url: `${origin}${url}`, alt: opts.alt };
  return null;
}

export function shareMetadata(input: {
  title: string;
  description: string;
  path: string;
  origin: string;
  image: ShareImage | null;
}): Metadata {
  const url = `${input.origin}${input.path}`;
  const image = input.image ?? {
    url: `${input.origin}${SITE_OG_IMAGE.url}`,
    width: SITE_OG_IMAGE.width,
    height: SITE_OG_IMAGE.height,
    alt: SITE_OG_IMAGE.alt,
  };
  const wide = !image.width || !image.height || image.width / image.height > 1.3;
  return {
    title: { absolute: input.title },
    description: input.description,
    // Shared pages stay out of search results, but previews still work.
    robots: { index: false, follow: false },
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url,
      title: input.title,
      description: input.description,
      images: [image],
    },
    twitter: {
      card: wide ? "summary_large_image" : "summary",
      title: input.title,
      description: input.description,
      images: [image.url],
    },
  };
}
