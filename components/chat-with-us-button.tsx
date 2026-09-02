"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/cn";
import { useMe } from "@/lib/hooks/wallet";

export function ChatWithUsButton({ className }: { className?: string }) {
  const me = useMe();
  const unread = me.data?.supportUnread || 0;
  const label = unread > 0 ? `Chat with us, ${unread} unread` : "Chat with us";

  return (
    <Link
      href="/wallet/support"
      className={cn(
        "relative rounded-full p-2 text-muted hover:bg-brand-soft hover:text-brand",
        className,
      )}
      aria-label={label}
    >
      <MessageSquare className="h-5 w-5" />
      {unread > 0 ? (
        <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-navy px-1 text-[10px] font-bold leading-4 text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
