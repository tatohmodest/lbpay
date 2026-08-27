"use client";

import { useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";

const EVENT = "lbpay-verify-prompt";

function storageKey(userId: string, status: string) {
  return `lbpay.hide-verify-prompt:${userId}:${status}`;
}

function readHidden(userId: string | undefined, status: string) {
  if (!userId || status === "verified") return true;
  try {
    return localStorage.getItem(storageKey(userId, status)) === "1";
  } catch {
    return false;
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(EVENT, onStoreChange);
  };
}

export function VerifyPrompt({
  userId,
  status,
}: {
  userId?: string;
  status: string;
}) {
  const getSnapshot = useCallback(() => readHidden(userId, status), [userId, status]);
  const hidden = useSyncExternalStore(subscribe, getSnapshot, () => true);

  if (!userId || status === "verified" || hidden) return null;

  const copy =
    status === "pending"
      ? {
          title: "We are reviewing your account",
          body: "You will get business benefits once this is done.",
        }
      : status === "rejected"
        ? {
            title: "We could not verify your account",
            body: "You can try again whenever you are ready.",
          }
        : {
            title: "Verify your account",
            body: "Unlock business benefits on LBPay.",
          };

  return (
    <Card className="relative border-brand/30 bg-brand-soft p-4 pr-12 lg:col-span-12">
      <Link href="/wallet/kyc" className="block">
        <p className="font-semibold text-ink">{copy.title}</p>
        <p className="mt-1 text-sm text-muted">{copy.body}</p>
      </Link>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          try {
            localStorage.setItem(storageKey(userId, status), "1");
          } catch {
            /* ignore */
          }
          window.dispatchEvent(new Event(EVENT));
        }}
        className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:bg-white/70 hover:text-ink"
      >
        <X className="h-4 w-4" />
      </button>
    </Card>
  );
}
