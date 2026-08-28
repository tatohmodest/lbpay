"use client";

import { Bell } from "lucide-react";
import { useNotify } from "@/lib/notify";
import { cn } from "@/lib/cn";

export function NotificationsButton({ className }: { className?: string }) {
  const { unread, openInbox } = useNotify();
  const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications";

  return (
    <button
      type="button"
      className={cn(
        "relative rounded-full p-2 text-muted hover:bg-brand-soft hover:text-brand",
        className,
      )}
      aria-label={label}
      onClick={openInbox}
    >
      <Bell className="h-5 w-5" />
      {unread > 0 ? (
        <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-navy px-1 text-[10px] font-bold leading-4 text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </button>
  );
}
