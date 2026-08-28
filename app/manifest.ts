import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "LBPay",
    short_name: "LBPay",
    description: "Send, receive, and collect XAF across MTN Mobile Money, Orange Money, and the LBPay wallet. (Cards coming soon)",
    start_url: "/wallet",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    prefer_related_applications: false,
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "en",
    dir: "ltr",
    categories: ["finance", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Wallet",
        short_name: "Wallet",
        url: "/wallet",
        description: "Open your XAF wallet",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Send",
        short_name: "Send",
        url: "/wallet/send",
        description: "Send money in Cameroon",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
