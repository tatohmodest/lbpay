"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";

export function ComingSoon({
  title,
  copy,
  when = "Coming soon",
  image,
  alt,
}: {
  title: string;
  copy: string;
  when?: string;
  image?: string;
  alt?: string;
}) {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted">{copy}</p>
      <Card className="mt-6 overflow-hidden rounded-[1.75rem] p-0">
        {image ? (
          <Image
            src={image}
            alt={alt || title}
            width={1536}
            height={1024}
            className="aspect-[3/2] w-full object-cover"
          />
        ) : null}
        <div className="p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">{when}</p>
          <h2 className="mt-2 text-xl font-black">This is not live yet</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            We will not take money from your wallet for this until it can actually be delivered.
          </p>
        </div>
      </Card>
    </div>
  );
}
