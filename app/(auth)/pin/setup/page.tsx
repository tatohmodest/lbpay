"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PinPad } from "@/components/auth/pin-pad";
import { AuthCard, AuthScreen, AuthTitle } from "@/components/auth-shell";
import { isMobileClient } from "@/lib/device";
import { readApiJson } from "@/lib/http";
import { useNotify } from "@/lib/notify";
import { useApp } from "@/lib/store";
import { useQueryClient } from "@tanstack/react-query";
import { consumeAuthNext } from "@/lib/auth-next";

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
    try {
      const res = await fetch("/api/auth/set-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: finalPin, confirm: finalPin, mobile: isMobileClient() }),
      });
      const data = await readApiJson<{ error?: string }>(res);
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
      router.push(consumeAuthNext("/wallet"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save PIN");
      setPin("");
      setConfirm("");
      setStage("create");
    }
  }

  return (
    <AuthScreen>
      <AuthTitle
        kicker="Security"
        title={stage === "create" ? "Create your PIN" : "Confirm your PIN"}
        subtitle="You will enter this PIN on login, when sending money, and when returning to the app on mobile."
        align="center"
      />
      <AuthCard>
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
      </AuthCard>
    </AuthScreen>
  );
}
