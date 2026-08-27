import { redirect } from "next/navigation";
import { findLinkByIdOrSlug } from "@/lib/server/db";
import { Card } from "@/components/ui/card";
import { NOINDEX } from "@/lib/site";
import { payLinkPath } from "@/lib/origin";

export const metadata = NOINDEX;

export default async function RequestPayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const link = await findLinkByIdOrSlug(id);
  if (link) redirect(payLinkPath(link.slug));

  return (
    <main className="grid min-h-screen place-items-center bg-paper p-4">
      <Card className="w-full max-w-md p-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Payment request</p>
        <h1 className="mt-2 text-xl font-bold">Link not found</h1>
        <p className="mt-3 text-sm text-muted">This payment request is missing or no longer active.</p>
      </Card>
    </main>
  );
}
