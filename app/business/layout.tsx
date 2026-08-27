import { NOINDEX } from "@/lib/site";
import { BusinessLayoutClient } from "./business-layout-client";

export const metadata = NOINDEX;

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <BusinessLayoutClient>{children}</BusinessLayoutClient>;
}
