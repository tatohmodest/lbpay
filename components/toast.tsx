"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";

export function Toast() {
  const { state, clearToast } = useApp();

  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(clearToast, 2800);
    return () => clearTimeout(t);
  }, [state.toast, clearToast]);

  if (!state.toast) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-[80] w-[min(92vw,420px)] -translate-x-1/2 lg:bottom-8">
      <div className="rounded-2xl bg-navy px-4 py-3 text-center text-sm font-medium text-white shadow-xl">
        {state.toast}
      </div>
    </div>
  );
}
