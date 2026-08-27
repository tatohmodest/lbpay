import { NOINDEX } from "@/lib/site";
import { AdminLayoutClient } from "./admin-layout-client";

export const metadata = NOINDEX;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
