"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PinPad } from "@/components/auth/pin-pad";
import { Logo } from "@/components/logo";
import { useMe } from "@/lib/hooks/wallet";
import { useApp } from "@/lib/store";
import type { Transaction, UserProfile } from "@/lib/types";

const PUBLIC = ["/", "/login", "/signup", "/verify", "/forgot", "/pin/setup", "/docs", "/pay", "/r"];
const WEB_IDLE_MS = 15 * 60 * 1000;
const HIDDEN_LOCK_MS = 2000;

function isPublic(path: string) {
  return PUBLIC.some((item) => (item === "/" ? path === "/" : path === item || path.startsWith(`${item}/`)));
}

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const me = useMe();
  const { state, hydrateFromServer, lockPin, unlockPin } = useApp();
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const hiddenAt = useRef<number | null>(null);
  const pinBusy = useRef(false);

  useEffect(() => {
    if (!me.data?.session || !me.data.user) return;
    hydrateFromServer({
      user: {
        id: me.data.user.id,
        name: me.data.user.name,
        lbpayId: me.data.user.lbpayId,
        email: me.data.user.email,
        phone: me.data.user.phone,
        avatar: me.data.user.avatar,
        kycStatus: me.data.user.kycStatus as UserProfile["kycStatus"],
        roles: me.data.user.roles || ["personal"],
        status: me.data.user.status === "frozen" ? "frozen" : "active",
        kyc: (me.data.user.kyc as UserProfile["kyc"]) || {
          personal: "unverified",
          business: "unverified",
          developer: "unverified",
        },
        businessName: me.data.user.businessName,
      },
      balance: me.data.balance ?? 0,
      transactions: (me.data.transactions as Transaction[]) || [],
    });
  }, [me.data, hydrateFromServer]);

  useEffect(() => {
    if (me.isFetched && !me.data?.session && !isPublic(path)) {
      router.replace("/login");
    }
  }, [me.isFetched, me.data?.session, path, router]);

  useEffect(() => {
    if (!me.data?.session) return;
    let timer: number;
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        lockPin();
        setPin("");
        setPinError("");
      }, WEB_IDLE_MS);
    };
    const events: Array<keyof WindowEventMap> = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, bump, { passive: true }));
    bump();
    return () => {
      window.clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, bump));
    };
  }, [me.data?.session, lockPin]);

  useEffect(() => {
    if (!me.data?.session) return;
    const lockIfAway = () => {
      if (hiddenAt.current && Date.now() - hiddenAt.current > HIDDEN_LOCK_MS) {
        lockPin();
        setPin("");
        setPinError("");
      }
    };
    const onVis = () => {
      if (document.hidden) hiddenAt.current = Date.now();
      else lockIfAway();
    };
    const onHide = () => {
      hiddenAt.current = Date.now();
    };
    const onShow = () => lockIfAway();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("pageshow", onShow);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("pageshow", onShow);
    };
  }, [me.data?.session, lockPin]);

  const submitPin = useCallback(
    async (value: string) => {
      if (pinBusy.current) return;
      pinBusy.current = true;
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: value, mobile: true }),
      });
      const data = await res.json().catch(() => ({}));
      pinBusy.current = false;
      if (!res.ok) {
        setPinError(data.error || "Incorrect PIN");
        setPin("");
        return;
      }
      setPinError("");
      setPin("");
      unlockPin();
    },
    [unlockPin],
  );

  const showLock = Boolean(me.data?.session && !state.pinUnlocked && !isPublic(path));

  return (
    <>
      {children}
      {showLock ? (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-paper px-6">
          <div className="w-full max-w-sm">
            <Logo href="/wallet" />
            <h1 className="mt-8 text-center text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mb-6 mt-1 text-center text-sm text-muted">
              Enter your PIN to open @{state.user.lbpayId}
            </p>
            <PinPad
              value={pin}
              onChange={(next) => {
                setPin(next);
                setPinError("");
                if (next.length === 4) void submitPin(next);
              }}
              error={pinError}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
