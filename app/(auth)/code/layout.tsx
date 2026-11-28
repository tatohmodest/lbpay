import { NOINDEX } from "@/lib/site";

export const metadata = NOINDEX;

export default function CodeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
