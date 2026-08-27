import { SiteHeader } from "@/components/marketing/site-header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <div className="pt-header">{children}</div>
    </div>
  );
}
