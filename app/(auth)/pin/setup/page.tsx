"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PinPad } from "@/components/auth/pin-pad";
import { isMobileClient } from "@/lib/device";
import { readApiJson } from "@/lib/http";
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
      router.push("/wallet");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save PIN");
      setPin("");
      setConfirm("");
      setStage("create");
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100svh-var(--header-h))] max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="text-center text-3xl font-semibold tracking-tight">
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
