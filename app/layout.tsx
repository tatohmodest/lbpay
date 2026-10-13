import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { AppProviders } from "@/components/providers";
import { SiteJsonLd } from "@/components/json-ld";
import { getRequestLocale } from "@/lib/i18n/server";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_OG_IMAGE,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";
import "./globals.css";

/** One family everywhere: the same clean sans on the website, the dashboard and checkout. */
const appSans = Plus_Jakarta_Sans({
  variable: "--font-app",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Serif accent used for one or two warm words in headlines (`.font-display`). */
const displaySerif = Instrument_Serif({
  variable: "--font-marketing-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: SITE_ORIGIN,
  title: {
    default: SITE_TITLE,
    template: "%s | LBPay",
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "finance",
  formatDetection: { telephone: false, email: false, address: false },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_OG_IMAGE.url],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#06261c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`${appSans.variable} ${geistMono.variable} ${displaySerif.variable} h-full`}>
      <body className="min-h-full bg-paper font-sans text-ink antialiased">
        <SiteJsonLd />
        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
