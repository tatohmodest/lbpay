"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";

function storageKey(userId: string, status: string) {
  return `lbpay.hide-verify-prompt:${userId}:${status}`;
}

export function VerifyPrompt({
  userId,
  status,
}: {
  userId?: string;
  status: string;
}) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!userId || status === "verified") {
      setHidden(true);
      return;
    }
    try {
      setHidden(localStorage.getItem(storageKey(userId, status)) === "1");
    } catch {
      setHidden(false);
    }
  }, [userId, status]);

  if (!userId || status === "verified" || hidden) return null;

  const copy =
    status === "pending"
      ? {
          title: "We're reviewing your account",
          body: "You'll get business benefits once this is done.",
        }
      : status === "rejected"
        ? {
            title: "We couldn't verify your account",
            body: "You can try again whenever you're ready.",
          }
        : {
            title: "Verify your account",
            body: "Unlock business benefits on LBPay.",
          };

  function dismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) return;
    try {
      localStorage.setItem(storageKey(userId, status), "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  }

  return (
    <Card className="relative border-brand/30 bg-brand-soft p-4 pr-12 lg:col-span-12">
      <Link href="/wallet/kyc" className="block">
        <p className="font-semibold text-ink">{copy.title}</p>
        <p className="mt-1 text-sm text-muted">{copy.body}</p>
      </Link>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:bg-white/70 hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
    </Card>
  );
}
