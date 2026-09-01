import { Plus_Jakarta_Sans } from "next/font/google";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

const marketingSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-marketing",
});

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${marketingSans.variable} marketing-root min-h-screen bg-paper antialiased`}>
      <SiteHeader />
      <div className="pt-header">{children}</div>
      <SiteFooter />
    </div>
  );
}
