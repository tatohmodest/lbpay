"use client";

import { use } from "react";
import { Card } from "@/components/ui/card";

export default function RequestPayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <main className="grid min-h-screen place-items-center bg-paper p-4">
      <Card className="w-full max-w-md p-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Payment request</p>
        <h1 className="mt-2 text-xl font-bold">Request {id}</h1>
        <p className="mt-3 text-sm text-muted">This request is no longer available.</p>
      </Card>
    </main>
  );
}
