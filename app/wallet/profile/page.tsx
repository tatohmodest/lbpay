"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LEGAL_NOTE } from "@/lib/flags";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import { isAdmin, productUnlocked } from "@/lib/roles";
import { CopyHandle } from "@/components/copy-handle";
import { disablePush, enablePush, openPushPrompt, pushPermission, pushSupported } from "@/lib/push-client";

export default function ProfilePage() {
  const { state, logout } = useApp();
  const me = useMe();
  const router = useRouter();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const user = me.data?.user;
  const roles = user?.roles || state.user.roles || ["personal"];

  return (
    <div className="mx-auto max-w-xl">
      <Card className="p-6 text-center">
        <Image
          src={state.user.avatar || "/illustrations/empty-wallet.png"}
          alt=""
          width={96}
          height={96}
          className="mx-auto h-24 w-24 rounded-full object-cover"
        />
        <h1 className="mt-4 text-2xl font-black">{state.user.name}</h1>
        <CopyHandle handle={me.data?.user?.lbpayId || state.user.lbpayId} className="mt-1 text-brand hover:text-brand-dark" />
        <p className="mt-1 text-sm text-muted">
          {state.user.phone} · {user?.status || "active"}
        </p>
        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-brand">{roles.join(" · ")}</p>
        <div className="mt-5 rounded-2xl bg-paper p-4 text-left">
          <p className="text-sm font-semibold text-ink">Account</p>
          <div className="mt-2 space-y-1 text-sm text-muted">
            <p>Personal: {user?.kyc?.personal || "unverified"}</p>
            <p>Business: {user?.kyc?.business || "unverified"}</p>
            <p>Developer: {user?.kyc?.developer || "unverified"}</p>
          </div>
          {user?.kyc?.personal === "verified" ? (
            <p className="mt-3 text-sm text-brand">Your account is verified.</p>
          ) : (
            <Link href="/wallet/kyc" className="mt-3 inline-block text-sm font-bold text-brand">
              {user?.kyc?.personal === "pending"
                ? "Review in progress"
                : user?.kyc?.personal === "rejected"
                  ? "Try again"
                  : "Verify account"}
            </Link>
          )}
        </div>
        {user?.status === "frozen" ? (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-danger">
            This account is frozen. An admin must restore it before money can move.
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2">
          <PushSettings />
          <Link href="/pin/forgot" className="text-sm font-bold text-brand">
            Forgot PIN
          </Link>
          <Link href="/wallet/kyc" className="text-sm font-bold text-brand">
            Verify account
          </Link>
          {productUnlocked(user, "business") ? (
            <Link href="/business" className="text-sm font-bold text-brand">
              Business console
            </Link>
          ) : (
            <Link href="/business" className="text-sm font-bold text-brand">
              {user?.kyc?.business === "pending" ? "Business application pending" : "Start collecting as a business"}
            </Link>
          )}
          {productUnlocked(user, "developer") ? (
            <Link href="/developers" className="text-sm font-bold text-brand">
              Developer portal
            </Link>
          ) : (
            <Link href="/developers" className="text-sm font-bold text-brand">
              {user?.kyc?.developer === "pending" ? "Developer application pending" : "Add payments to your product"}
            </Link>
          )}
          {isAdmin(user) ? (
            <Link href="/admin" className="text-sm font-bold text-brand">
              Open admin console
            </Link>
          ) : null}
        </div>
        <Button
          className="mt-6"
          variant="secondary"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            queryClient.clear();
            logout();
            notify.info("Signed out", "Come back anytime. Your PIN will be required.");
            router.push("/");
          }}
        >
          Sign out
        </Button>
      </Card>
      <p className="mt-4 text-xs text-muted">{LEGAL_NOTE}</p>
    </div>
  );
}

function PushSettings() {
  const notify = useNotify();
  const browserPermission = useSyncExternalStore(
    () => () => undefined,
    () => (typeof Notification === "undefined" ? "default" : Notification.permission),
    () => "default",
  );
  const [localPermission, setLocalPermission] = useState<NotificationPermission | null>(null);
  const [busy, setBusy] = useState(false);
  const permission = localPermission ?? browserPermission;

  async function toggle() {
    setBusy(true);
    if (permission === "granted") {
      await disablePush();
      setLocalPermission(pushPermission());
      notify.info("Alerts off", "This phone will no longer receive LBPay popups.");
      setBusy(false);
      return;
    }
    const result = await enablePush();
    setLocalPermission(pushPermission());
    setBusy(false);
    if (!result.ok) {
      notify.error("Could not enable alerts", result.error);
      openPushPrompt();
      return;
    }
    notify.success("Alerts on", "This phone will ping for transactions and account changes.");
  }

  if (!pushSupported()) {
    return (
      <p className="rounded-2xl bg-paper px-4 py-3 text-sm text-muted">
        This browser cannot show phone alerts. Install the LBPay app, then try again.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-paper px-4 py-3 text-left">
      <p className="text-sm font-medium text-ink">Phone alerts</p>
      <p className="mt-1 text-xs leading-5 text-muted">
        Pop up on this phone for money in, money out, collections, KYC, and account changes.
      </p>
      <Button
        type="button"
        variant={permission === "granted" ? "secondary" : undefined}
        className="mt-3 w-full"
        disabled={busy}
        onClick={() => void toggle()}
      >
        {busy ? "Please wait…" : permission === "granted" ? "Turn alerts off" : "Turn alerts on"}
      </Button>
    </div>
  );
}
