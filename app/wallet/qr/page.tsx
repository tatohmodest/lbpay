"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PayQR } from "@/components/qr";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import { payHandleUrl } from "@/lib/origin";
import { useBrowserOrigin } from "@/lib/use-origin";
import { CopyHandle } from "@/components/copy-handle";

export default function WalletQrPage() {
  const { state } = useApp();
  const me = useMe();
  const handle = me.data?.user?.lbpayId || state.user.lbpayId;
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
    <div className="mx-auto max-w-sm text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Receive</p>
      <h1 className="mt-1 text-2xl font-black">My QR</h1>
      <p className="mt-1 text-sm text-muted">Let anyone scan and pay you.</p>
      <div className="mt-5 flex flex-col items-center rounded-[2rem] bg-navy p-5 text-white">
        {payUrl ? <PayQR value={payUrl} size={140} /> : <div className="h-[140px] w-[140px] rounded-2xl bg-white/10" />}
        <CopyHandle handle={handle} className="mt-4 text-white hover:text-white/80" />
        <p className="mt-2 break-all font-mono text-[11px] leading-4 text-white/70">
          {payUrl || "Preparing your pay link…"}
        </p>
        <Button className="mt-4 w-full" variant="secondary" onClick={() => void copyUrl()} disabled={!payUrl}>
          {copied ? "Copied" : "Copy pay link"}
        </Button>
      </div>
    </div>
  );
}
