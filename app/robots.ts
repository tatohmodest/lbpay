import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/docs", "/login", "/signup", "/products/"],
        disallow: [
          "/wallet",
          "/business",
          "/developers",
          "/admin",
          "/api/",
          "/pin",
          "/verify",
          "/pay/",
          "/r/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
