import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const publicRoutes = [
    { path: "/", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/products/wallet", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/products/business", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/products/developers", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/docs", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/copyright", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/signup", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/login", changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  return publicRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
