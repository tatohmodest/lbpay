import { SiteHeader } from "@/components/marketing/site-header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <div className="pt-header">{children}</div>
    </div>
  );
}
