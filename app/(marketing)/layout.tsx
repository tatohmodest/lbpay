import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper font-sans antialiased">
      <SiteHeader />
      <div className="pt-header">{children}</div>
      <SiteFooter />
    </div>
  );
}
