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
  "/p/:path*",
  "/r/:path*",
];

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  turbopack: {
    resolveAlias: {
      "next/og": "./lib/og-stub.js",
      "@vercel/og": "./lib/og-stub.js",
      "next/dist/compiled/@vercel/og/index.edge.js": "./lib/og-stub.js",
      "next/dist/compiled/@vercel/og/index.node.js": "./lib/og-stub.js",
    },
  },
  images: {
    unoptimized: true,
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
      {
        source: "/og.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/apps/lbpay.apk",
        headers: [
          { key: "Content-Type", value: "application/vnd.android.package-archive" },
          { key: "Content-Disposition", value: 'attachment; filename="LBPay.apk"' },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

export default nextConfig;
