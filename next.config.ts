import type { NextConfig } from "next";

const noIndexSources = [
  "/wallet/:path*",
  "/business/:path*",
  "/developers/:path*",
  "/admin/:path*",
  "/api/:path*",
  "/pin/:path*",
  "/verify",
  "/verify/:path*",
  "/forgot",
  "/forgot/:path*",
  "/pay/:path*",
  "/r/:path*",
];

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/illustrations/**",
      },
      {
        pathname: "/icons/**",
      },
    ],
  },
  async headers() {
    return [
      ...noIndexSources.map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
    ];
  },
};

export default nextConfig;
