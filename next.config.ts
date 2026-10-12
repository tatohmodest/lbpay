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

const frameProtectedSources = [
  "/wallet/:path*",
  "/business/:path*",
  "/developers/:path*",
  "/admin/:path*",
  "/pin/:path*",
  "/login",
  "/signup",
  "/verify",
  "/forgot",
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
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(self)" },
        ],
      },
      // Signed-in surfaces must never render inside someone else's frame.
      ...frameProtectedSources.map((source) => ({
        source,
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      })),
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
    ];
  },
};

export default nextConfig;
