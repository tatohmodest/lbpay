"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { inviteShareText, inviteSignupUrl } from "@/lib/invite";
import { useMe } from "@/lib/hooks/wallet";
import { useApp } from "@/lib/store";
import { useNotify } from "@/lib/notify";

export function InviteSomeone() {
  const me = useMe();
  const { state } = useApp();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const handle = me.data?.user?.lbpayId || state.user.lbpayId || "";

  function openInvite() {
    setUrl(inviteSignupUrl(handle, window.location.origin));
    setOpen(true);
  }

  async function copyLink() {
    const shareUrl = url || inviteSignupUrl(handle, window.location.origin);
    try {
      await navigator.clipboard.writeText(shareUrl);
      notify.success("Link copied", "Send it to a friend.");
    } catch {
      notify.info("Copy this link", shareUrl);
    }
  }

  async function shareLink() {
    const shareUrl = url || inviteSignupUrl(handle, window.location.origin);
    const text = inviteShareText(handle, shareUrl);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "LBPay", text, url: shareUrl });
        return;
      } catch {
        // User cancelled, or share is unavailable. Copy instead.
      }
    }
    await copyLink();
  }

  return (
    <>
      <button
        type="button"
        onClick={openInvite}
        className="flex w-full items-center gap-4 overflow-hidden rounded-[2rem] bg-white p-3 text-left shadow-[0_1px_2px_rgba(12,25,19,0.04)] transition hover:bg-paper/60"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/gift-box.webp"
          alt=""
          width={112}
          height={112}
          className="h-24 w-24 shrink-0 rounded-[1.35rem] object-cover"
        />
        <span className="min-w-0 pr-2">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
            Friends
          </span>
          <span className="mt-1 block text-lg font-black text-ink">Invite someone</span>
          <span className="mt-1 block text-sm leading-5 text-muted">
            Share your link. They open a wallet.
          </span>
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[85] grid place-items-end bg-navy/50 p-0 md:place-items-center md:p-6">
          <div className="w-full max-w-md rounded-t-[2rem] bg-white p-6 shadow-2xl md:rounded-[2rem]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/gift-box.webp"
              alt=""
              width={160}
              height={160}
              className="mx-auto h-36 w-36 object-contain"
            />
            <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              Invite
            </p>
            <h2 className="mt-1 text-center text-2xl font-black">Invite someone</h2>
            <p className="mt-2 text-center text-sm leading-6 text-muted">
              {handle
                ? `Share your signup link. They create a wallet. Your handle is @${handle}.`
                : "Share your signup link. They create a wallet."}
            </p>
            <p className="mt-4 break-all rounded-2xl bg-paper px-4 py-3 font-mono text-xs font-semibold text-ink">
              {url}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button type="button" variant="secondary" onClick={() => void copyLink()}>
                Copy link
              </Button>
              <Button type="button" onClick={() => void shareLink()}>
                Share
              </Button>
            </div>
            <button
              type="button"
              className="mt-4 w-full text-sm font-bold text-muted"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
