"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PayQR } from "@/components/qr";
import { useApp } from "@/lib/store";
import { payHandleUrl } from "@/lib/origin";
import { useBrowserOrigin } from "@/lib/use-origin";
import { CopyHandle } from "@/components/copy-handle";

export default function WalletQrPage() {
  const { state } = useApp();
  const handle = state.user.lbpayId;
  const origin = useBrowserOrigin();
  const payUrl = handle && origin ? payHandleUrl(handle, origin) : "";
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    if (!payUrl) return;
    await navigator.clipboard.writeText(payUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-black">Receive via QR</h1>
      <p className="mt-1 text-sm text-muted">Let anyone scan and pay you instantly.</p>
      <Card className="mt-6 flex flex-col items-center bg-navy p-8 text-white">
        {payUrl ? <PayQR value={payUrl} /> : <div className="h-[180px] w-[180px] rounded-2xl bg-white/10" />}
        <CopyHandle handle={handle} className="mt-4 text-white hover:text-white/80" />
        <p className="mt-2 break-all font-mono text-xs text-white/70">{payUrl || "Preparing your pay link…"}</p>
        <Button className="mt-4" variant="secondary" onClick={() => void copyUrl()} disabled={!payUrl}>
          {copied ? "Copied" : "Copy pay link"}
        </Button>
      </Card>
    </div>
  );
}
