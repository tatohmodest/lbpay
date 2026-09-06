"use client";

import { useState } from "react";
import { Check, Copy, MoreHorizontal, Share2 } from "lucide-react";
import { copyText } from "@/lib/clipboard";
import { facebookShareUrl, telegramShareUrl, whatsappShareUrl } from "@/lib/shop";
import { useNotify } from "@/lib/notify";
import { cn } from "@/lib/cn";

export function ShareRow({
  url,
  text,
  copyLabel = "Copy link",
  className,
}: {
  url: string;
  text: string;
  copyLabel?: string;
  className?: string;
}) {
  const notify = useNotify();
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!url) return;
    try {
      await copyText(url);
      setCopied(true);
      notify.success("Copied", "Share this link.");
      window.setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      notify.error("Could not copy", err instanceof Error ? err.message : "Copy it yourself.");
    }
  }

  function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: text.split("\n")[0], text, url }).catch(() => null);
      return;
    }
    void copy();
  }

  return (
    <div className={cn("space-y-3", className)}>
      <button
        type="button"
        onClick={() => void copy()}
        disabled={!url}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,179,105,0.28)] hover:bg-brand-dark disabled:opacity-50"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : copyLabel}
      </button>
      <div className="flex items-center justify-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Share via</span>
        <a
          href={whatsappShareUrl(text)}
          target="_blank"
          rel="noreferrer"
          className="grid h-10 w-10 place-items-center rounded-full bg-[#25d366] text-white"
          aria-label="Share on WhatsApp"
        >
          <WhatsAppMark />
        </a>
        <a
          href={facebookShareUrl(url)}
          target="_blank"
          rel="noreferrer"
          className="grid h-10 w-10 place-items-center rounded-full bg-[#1877f2] text-white"
          aria-label="Share on Facebook"
        >
          <span className="text-sm font-black">f</span>
        </a>
        <a
          href={telegramShareUrl(url, text)}
          target="_blank"
          rel="noreferrer"
          className="grid h-10 w-10 place-items-center rounded-full bg-[#2aabee] text-white"
          aria-label="Share on Telegram"
        >
          <Share2 className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={nativeShare}
          className="grid h-10 w-10 place-items-center rounded-full bg-[#eef1ef] text-ink"
          aria-label="More ways to share"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.47 1.34 4.98L2 22l5.2-1.36A9.93 9.93 0 0 0 12.04 22c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2zm0 18.18c-1.56 0-3.09-.42-4.43-1.22l-.32-.19-3.08.8.82-3-.2-.33a8.16 8.16 0 0 1-1.26-4.36c0-4.5 3.67-8.16 8.17-8.16 4.5 0 8.16 3.66 8.16 8.16 0 4.5-3.66 8.3-8.16 8.3zm4.47-6.11c-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.1-.1.24-.26.36-.4.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.4-.54-.4h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.02.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28z" />
    </svg>
  );
}
