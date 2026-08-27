import { NOINDEX } from "@/lib/site";
import { DevelopersLayoutClient } from "./developers-layout-client";

export const metadata = NOINDEX;

export default function DevelopersLayout({ children }: { children: React.ReactNode }) {
  return <DevelopersLayoutClient>{children}</DevelopersLayoutClient>;
}
