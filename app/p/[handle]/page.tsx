"use client";

import { use } from "react";
import { Suspense } from "react";
import { ShopListing } from "@/components/shop-listing";

export default function PayHandlePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle: raw } = use(params);
  const handle = decodeURIComponent(raw || "").replace(/^@/, "").trim().toLowerCase();

  return (
    <Suspense fallback={<p className="grid min-h-screen place-items-center text-sm text-muted">Opening shop…</p>}>
      <ShopListing handle={handle} />
    </Suspense>
  );
}
