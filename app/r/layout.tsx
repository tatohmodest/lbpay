import { NOINDEX } from "@/lib/site";

export const metadata = NOINDEX;

export default function RequestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
