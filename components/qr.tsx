"use client";

import { QRCodeSVG } from "qrcode.react";

export function PayQR({ value, size = 180 }: { value: string; size?: number }) {
  const mark = size < 160 ? 28 : 36;
  return (
    <div className="rounded-2xl bg-white p-3">
      <QRCodeSVG
        value={value}
        size={size}
        bgColor="#ffffff"
        fgColor="#0f1f17"
        level="M"
        imageSettings={{
          src: "/illustrations/lbpay-mark.webp",
          height: mark,
          width: mark,
          excavate: true,
        }}
      />
    </div>
  );
}
