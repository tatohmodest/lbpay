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
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "next/og": false,
      "@vercel/og": false,
    };
    return config;
  },
  images: {
    localPatterns: [
      {
        pathname: "/illustrations/**",
      },
      {
        pathname: "/icons/**",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
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
      {
        source: "/og.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
