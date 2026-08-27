import { NOINDEX } from "@/lib/site";

export const metadata = NOINDEX;

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
