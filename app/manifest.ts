import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LBPay — Payments for Cameroon",
    short_name: "LBPay",
    description:
      "Send, receive, and collect XAF across MTN Mobile Money, Orange Money, cards, and the LBPay wallet.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3faf6",
    theme_color: "#00b369",
    lang: "en",
    icons: [
      {
        src: "/illustrations/lbpay-mark.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/illustrations/lbpay-mark.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
