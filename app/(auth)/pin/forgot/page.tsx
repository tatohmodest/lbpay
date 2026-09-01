"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard, AuthScreen, AuthTitle } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { PinPad } from "@/components/auth/pin-pad";
import { readApiJson, type AuthApiResponse } from "@/lib/http";
import { useNotify } from "@/lib/notify";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import { useQueryClient } from "@tanstack/react-query";

type Step = "email" | "otp" | "password" | "pin" | "done";

export default function ForgotPinPage() {
  const router = useRouter();
  const notify = useNotify();
  const me = useMe();
  const queryClient = useQueryClient();
  const { unlockPin } = useApp();
  const knownEmail = (me.data?.user?.email || "").trim().toLowerCase();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pinStage, setPinStage] = useState<"create" | "confirm">("create");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendCode(target = email || knownEmail) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/pin/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
      const data = await readApiJson<AuthApiResponse & { message?: string }>(res);
      if (!res.ok) throw new Error(data.error || "Could not send the code");
      setEmail(data.email || target);
      setSent(true);
      setStep("otp");
      notify.info("Check your email", data.message || "If an account exists, we sent a 6-digit code.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/pin/forgot/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await readApiJson<AuthApiResponse>(res);
      if (!res.ok) throw new Error(data.error || "Could not verify");
      setStep("password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify");
    } finally {
      setLoading(false);
    }
  }

  async function confirmPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/pin/forgot/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await readApiJson<AuthApiResponse>(res);
      if (!res.ok) throw new Error(data.error || "Could not confirm");
      setStep("pin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm");
    } finally {
      setLoading(false);
    }
  }

  async function savePin(finalPin: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/pin/forgot/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: finalPin, confirm: finalPin }),
      });
      const data = await readApiJson<AuthApiResponse>(res);
      if (!res.ok) throw new Error(data.error || "Could not update PIN");
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      unlockPin();
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update PIN");
      setPin("");
      setConfirm("");
      setPinStage("create");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen>
      {step === "email" ? (
        <>
          <AuthTitle
            kicker="Security"
            title="Forgot PIN"
            subtitle="Enter the email on your account. We will send a code to confirm it is you."
          />
          <AuthCard>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                void sendCode();
              }}
            >
              {knownEmail ? (
                <p className="rounded-2xl bg-paper px-4 py-3 text-sm text-muted">
                  We will send a code to <span className="font-semibold text-ink">{knownEmail}</span>
                </p>
              ) : (
                <Field label="Email">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </Field>
              )}
              {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading || (!knownEmail && email.trim().length < 5)}>
                {loading ? "Please wait…" : "Send code"}
              </Button>
            </form>
          </AuthCard>
        </>
      ) : null}

      {step === "otp" ? (
        <>
          <AuthTitle
            kicker="Inbox"
            title="Verify it is you"
            subtitle={
              sent
                ? `We sent a 6-digit code to ${email || "your inbox"}.`
                : "We will send a 6-digit code to confirm it is you."
            }
          />
          <AuthCard>
            {!sent ? (
              <Button onClick={() => void sendCode(knownEmail || email)} disabled={loading}>
                {loading ? "Please wait…" : "Send code"}
              </Button>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={verifyCode}>
                <Field label="Code">
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    className="text-center font-mono text-2xl tracking-[0.4em]"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                  />
                </Field>
                {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
                <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                  {loading ? "Please wait…" : "Verify code"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => void sendCode()}>
                  Resend code
                </Button>
              </form>
            )}
          </AuthCard>
        </>
      ) : null}

      {step === "password" ? (
        <>
          <AuthTitle
            kicker="Confirm"
            title="Enter your password"
            subtitle="This confirms the account before a new PIN is set."
          />
          <AuthCard>
            <form className="flex flex-col gap-4" onSubmit={confirmPassword}>
              <Field label="Password">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </Field>
              {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait…" : "Continue"}
              </Button>
            </form>
          </AuthCard>
        </>
      ) : null}

      {step === "pin" ? (
        <>
          <AuthTitle
            kicker="Security"
            title={pinStage === "create" ? "Set a new PIN" : "Confirm your new PIN"}
            subtitle="Choose 4 digits you will remember."
            align="center"
          />
          <AuthCard>
          {pinStage === "create" ? (
            <PinPad
              value={pin}
              onChange={(next) => {
                setPin(next);
                if (next.length === 4) setPinStage("confirm");
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
                    setPin("");
                    setPinStage("create");
                    return;
                  }
                  void savePin(next);
                }
              }}
              error={error}
              hint={loading ? "Saving…" : "Enter the same 4 digits again"}
            />
          )}
          </AuthCard>
        </>
      ) : null}

      {step === "done" ? (
        <>
          <AuthTitle
            kicker="Done"
            title="Thank you"
            subtitle="Your PIN has been updated. Use it the next time you confirm a payment."
          />
          <AuthCard>
            <Button
              className="w-full"
              onClick={() => router.push(me.data?.session ? "/wallet" : "/login")}
            >
              {me.data?.session ? "Back to wallet" : "Sign in"}
            </Button>
          </AuthCard>
        </>
      ) : null}

      {step !== "done" ? (
        <p className="mt-6 text-sm text-muted">
          Remembered it?{" "}
          <Link href={me.data?.session ? "/wallet" : "/login"} className="font-bold text-brand">
            Go back
          </Link>
        </p>
      ) : null}
    </AuthScreen>
  );
}
