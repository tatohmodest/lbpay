"use client";

import { Card } from "@/components/ui/card";
import { PayQR } from "@/components/qr";
import { useApp } from "@/lib/store";

export default function WalletQrPage() {
  const { state } = useApp();
  const value = `https://lbpay.me/@${state.user.lbpayId}`;

  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-black">Receive via QR</h1>
      <p className="mt-1 text-sm text-muted">Let anyone scan and pay you instantly.</p>
      <Card className="mt-6 flex flex-col items-center bg-navy p-8 text-white">
        <PayQR value={value} />
        <p className="mt-4 font-mono">@{state.user.lbpayId}</p>
      </Card>
    </div>
  );
}
