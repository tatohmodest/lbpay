"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { PinPad } from "@/components/auth/pin-pad";
import { isMobileClient } from "@/lib/device";
import { useNotify } from "@/lib/notify";
import { useApp } from "@/lib/store";
import { useQueryClient } from "@tanstack/react-query";

export default function PinSetupPage() {
  const router = useRouter();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { login, unlockPin } = useApp();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [stage, setStage] = useState<"create" | "confirm">("create");
  const [error, setError] = useState("");

  async function save(finalPin: string) {
    const res = await fetch("/api/auth/set-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: finalPin, confirm: finalPin, mobile: isMobileClient() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not save PIN");
      setPin("");
      setConfirm("");
      setStage("create");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["me"] });
    login();
    unlockPin();
    notify.success("PIN set", "Use it to confirm sends and to reopen the app.");
    router.push("/wallet");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Logo />
      <h1 className="mt-10 text-center text-3xl font-black">
        {stage === "create" ? "Create your PIN" : "Confirm your PIN"}
      </h1>
      <p className="mt-2 mb-8 text-center text-sm text-muted">
        You will enter this PIN on login, when sending money, and when returning to the app on mobile.
      </p>
      {stage === "create" ? (
        <PinPad
          value={pin}
          onChange={(next) => {
            setPin(next);
            if (next.length === 4) setStage("confirm");
          }}
          error={error}
        />
      ) : (
        <PinPad
          value={confirm}
          onChange={(next) => {
            setConfirm(next);
            setError("");
            if (next.length === 4) {
              if (next !== pin) {
                setError("PINs do not match");
                setConfirm("");
                setStage("create");
                setPin("");
                return;
              }
              void save(next);
            }
          }}
          error={error}
          hint="Enter the same 4 digits again"
        />
      )}
    </div>
  );
}
