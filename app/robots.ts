import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/docs",
          "/login",
          "/signup",
          "/forgot",
          "/products/",
          "/og.png",
          "/opengraph-image",
          "/twitter-image",
          "/illustrations/",
          "/icons/",
          "/pay/",
        ],
        disallow: [
          "/wallet",
          "/business",
          "/developers",
          "/admin",
          "/api/",
          "/pin",
          "/verify",
          "/p/",
          "/r/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
