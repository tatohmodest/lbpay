import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/illustrations/**",
      },
    ],
  },
};

export default nextConfig;
