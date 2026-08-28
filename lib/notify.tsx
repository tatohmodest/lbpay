"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence } from "@/components/notify-list";

export type NoticeKind = "success" | "error" | "pending" | "info" | "money-in" | "money-out";

export type Notice = {
  id: string;
  kind: NoticeKind;
  title: string;
  message: string;
  amount?: number;
};

export type InboxNotice = Notice & {
  createdAt: number;
  read: boolean;
};

type NotifyApi = {
  notices: Notice[];
  inbox: InboxNotice[];
  unread: number;
  inboxOpen: boolean;
  openInbox: () => void;
  closeInbox: () => void;
  push: (notice: Omit<Notice, "id">) => void;
  dismiss: (id: string) => void;
  success: (title: string, message: string) => void;
  error: (title: string, message: string) => void;
  pending: (title: string, message: string) => void;
  info: (title: string, message: string) => void;
  moneyOut: (amount: number, message: string) => void;
  moneyIn: (amount: number, message: string) => void;
};

const NotifyContext = createContext<NotifyApi | null>(null);
const STORAGE_KEY = "lbpay.inbox.v1";
const MAX_INBOX = 40;

function loadInbox(): InboxNotice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InboxNotice[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_INBOX) : [];
  } catch {
    return [];
  }
}

function saveInbox(items: InboxNotice[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_INBOX)));
}

function keepInInbox(kind: NoticeKind, title: string) {
  if (title === "Copied") return false;
  if (title === "You're in" || title === "Signed out" || title === "Admin unlocked") return false;
  if (title === "Check your email" || title === "Still waiting" || title === "Not confirmed yet") return false;
  return kind !== "info";
}

function kindFromPush(title: string): NoticeKind {
  const value = title.toLowerCase();
  if (value.includes("fail")) return "error";
  if (value.includes("received") || value.includes("added") || value.includes("collected")) return "money-in";
  if (value.includes("sent") || value.includes("withdrawn") || value.includes("paid") || value.includes("bought")) {
    return "money-out";
  }
  return "info";
}

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [inbox, setInbox] = useState<InboxNotice[]>([]);
  const [inboxOpen, setInboxOpen] = useState(false);

  useEffect(() => {
    setInbox(loadInbox());
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotices((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const remember = useCallback((notice: InboxNotice) => {
    setInbox((prev) => {
      const next = [notice, ...prev.filter((item) => item.id !== notice.id)].slice(0, MAX_INBOX);
      saveInbox(next);
      return next;
    });
  }, []);

  const push = useCallback(
    (notice: Omit<Notice, "id">) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const item = { ...notice, id };
      setNotices((prev) => [item, ...prev].slice(0, 4));
      window.setTimeout(() => dismiss(id), notice.kind === "error" ? 7000 : 4200);
      if (keepInInbox(notice.kind, notice.title)) {
        remember({ ...item, createdAt: Date.now(), read: false });
      }
    },
    [dismiss, remember],
  );

  const openInbox = useCallback(() => setInboxOpen(true), []);

  const closeInbox = useCallback(() => {
    setInboxOpen(false);
    setInbox((prev) => {
      const next = prev.map((item) => ({ ...item, read: true }));
      saveInbox(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; title?: string; body?: string } | undefined;
      if (data?.type !== "LB_NOTIFY" || !data.title) return;
      const title = String(data.title);
      const message = String(data.body || "You have a new update.");
      remember({
        id: `push_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        kind: kindFromPush(title),
        title,
        message,
        createdAt: Date.now(),
        read: false,
      });
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [remember]);

  const unread = inbox.filter((item) => !item.read).length;

  const api = useMemo<NotifyApi>(
    () => ({
      notices,
      inbox,
      unread,
      inboxOpen,
      openInbox,
      closeInbox,
      push,
      dismiss,
      success: (title, message) => push({ kind: "success", title, message }),
      error: (title, message) => push({ kind: "error", title, message }),
      pending: (title, message) => push({ kind: "pending", title, message }),
      info: (title, message) => push({ kind: "info", title, message }),
      moneyOut: (amount, message) =>
        push({ kind: "money-out", title: "Money sent", message, amount }),
      moneyIn: (amount, message) =>
        push({ kind: "money-in", title: "Money received", message, amount }),
    }),
    [notices, inbox, unread, inboxOpen, openInbox, closeInbox, push, dismiss],
  );

  return (
    <NotifyContext.Provider value={api}>
      {children}
      <AnimatePresence notices={notices} dismiss={dismiss} />
    </NotifyContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotifyContext);
  if (!ctx) throw new Error("useNotify must be used within NotifyProvider");
  return ctx;
}
