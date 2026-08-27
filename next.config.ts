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
    ],
  },
  async headers() {
    return noIndexSources.map((source) => ({
      source,
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }));
  },
};

export default nextConfig;
