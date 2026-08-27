import { NOINDEX } from "@/lib/site";

export const metadata = NOINDEX;

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
