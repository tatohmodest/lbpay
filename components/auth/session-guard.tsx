"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { PinPad } from "@/components/auth/pin-pad";
import { Logo } from "@/components/logo";
import { useMe } from "@/lib/hooks/wallet";
import { useApp } from "@/lib/store";
import { secondsLeft, useNow } from "@/lib/use-now";
import type { Transaction, UserProfile } from "@/lib/types";

const PUBLIC = [
  "/",
  "/login",
  "/signup",
  "/verify",
  "/forgot",
  "/pin/setup",
  "/docs",
  "/pay",
  "/p",
  "/r",
  "/products",
  "/pin",
  "/welcome",
];
const WEB_IDLE_MS = 15 * 60 * 1000;
const HIDDEN_LOCK_MS = 2000;

function isPublic(path: string) {
  return PUBLIC.some((item) => (item === "/" ? path === "/" : path === item || path.startsWith(`${item}/`)));
}

function skipPinLock(path: string) {
  return isPublic(path) || path === "/admin/otp" || path.startsWith("/admin/otp/");
}

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const me = useMe();
  const { state, hydrateFromServer, lockPin, unlockPin } = useApp();
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [lockedUntil, setLockedUntil] = useState(0);
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
        businessKind: me.data.user.businessKind,
      },
      balance: me.data.balance ?? 0,
      transactions: (me.data.transactions as Transaction[]) || [],
    });
  }, [me.data, hydrateFromServer]);

  useEffect(() => {
    if (me.isFetched && !me.isFetching && !me.data?.session && !isPublic(path)) {
      router.replace("/login");
    }
  }, [me.isFetched, me.isFetching, me.data?.session, path, router]);

  useEffect(() => {
    if (!me.data?.session) return;
    if (skipPinLock(path)) return;
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
  }, [me.data?.session, lockPin, path]);

  useEffect(() => {
    if (!me.data?.session) return;
    if (skipPinLock(path)) return;
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
  }, [me.data?.session, lockPin, path]);

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
        setLockedUntil(Number(data.retryAfter) ? Date.now() + Number(data.retryAfter) * 1000 : 0);
        setPin("");
        return;
      }
      setPinError("");
      setLockedUntil(0);
      setPin("");
      unlockPin();
    },
    [unlockPin],
  );

  const now = useNow(lockedUntil > 0);
  const pinWait = secondsLeft(lockedUntil, now);
  const showLock = Boolean(me.data?.session && !state.pinUnlocked && !skipPinLock(path));

  return (
    <>
      {children}
      {showLock ? (
        <div className="fixed inset-0 z-95 grid place-items-center bg-paper px-6">
          <div className="w-full max-w-sm">
            <Logo href="/wallet" />
            <h1 className="mt-8 text-center text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mb-6 mt-1 text-center text-sm text-muted">
              Enter your PIN to open @{state.user.lbpayId}
            </p>
            <PinPad
              value={pin}
              disabled={pinWait > 0}
              onChange={(next) => {
                setPin(next);
                setPinError("");
                if (next.length === 4 && pinWait <= 0) void submitPin(next);
              }}
              error={pinError}
              hint={pinWait > 0 ? `Too many incorrect PINs. Wait ${pinWait}s.` : undefined}
            />
            <Link href="/pin/forgot" className="mt-6 block text-center text-sm font-semibold text-brand">
              Forgot PIN?
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
