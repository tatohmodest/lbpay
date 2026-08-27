"use client";

import { Card } from "@/components/ui/card";

export function ComingSoon({
  title,
  copy,
}: {
  title: string;
  copy: string;
}) {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">{title}</h1>
      <p className="mt-1 text-sm text-muted">{copy}</p>
      <Card className="mt-6 p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">Coming soon</p>
        <h2 className="mt-2 text-xl font-black">This is not live yet</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          We will not take money from your wallet for this until it can actually be delivered.
        </p>
      </Card>
    </div>
  );
}
