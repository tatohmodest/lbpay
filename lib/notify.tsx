"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence } from "@/components/notify-list";

export type NoticeKind = "success" | "error" | "pending" | "info" | "money-in" | "money-out";

export type Notice = {
  id: string;
  kind: NoticeKind;
  title: string;
  message: string;
  amount?: number;
};

type NotifyApi = {
  notices: Notice[];
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

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotices((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (notice: Omit<Notice, "id">) => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setNotices((prev) => [{ ...notice, id }, ...prev].slice(0, 4));
      window.setTimeout(() => dismiss(id), notice.kind === "error" ? 7000 : 4200);
    },
    [dismiss],
  );

  const api = useMemo<NotifyApi>(
    () => ({
      notices,
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
    [notices, push, dismiss],
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
