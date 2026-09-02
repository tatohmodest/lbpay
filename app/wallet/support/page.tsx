"use client";

import { SupportChat } from "@/components/support-chat";

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Help</p>
      <h1 className="mt-1 text-2xl font-black tracking-tight">Chat with us</h1>
      <p className="mt-1 text-sm text-muted">
        Send a message to LBPay. We get it by email and keep the conversation here so we can reply in the app.
      </p>
      <div className="mt-6">
        <SupportChat
          endpoint="/api/support"
          emptyTitle="None"
          emptyCopy="No messages yet. Write below and the team will reply here."
          composerLabel="Your message"
          mine="user"
        />
      </div>
    </div>
  );
}
