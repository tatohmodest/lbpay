"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard, AuthTitle } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { PinPad } from "@/components/auth/pin-pad";
import { isMobileClient } from "@/lib/device";
import { readApiJson, type AuthApiResponse } from "@/lib/http";
import { useNotify } from "@/lib/notify";
import { useApp } from "@/lib/store";
import { useQueryClient } from "@tanstack/react-query";
import { cameroonMsisdn } from "@/lib/phone";
import { secondsLeft, useNow } from "@/lib/use-now";
import { normalizeHandle } from "@/lib/handle";
import { slugify } from "@/lib/format";

export function AuthForm({
  mode,
  notice,
  invitedBy,
}: {
  mode: "login" | "signup";
  notice?: string;
  invitedBy?: string;
}) {
  const router = useRouter();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { login, unlockPin } = useApp();
  const [step, setStep] = useState<"form" | "pin">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [lockedUntil, setLockedUntil] = useState(0);
  const [loading, setLoading] = useState(false);
  const [idChoice, setIdChoice] = useState("");
  const [idConflict, setIdConflict] = useState<{ taken: string; suggestion: string } | null>(null);
  const [showHandleChange, setShowHandleChange] = useState(false);
  const now = useNow(lockedUntil > 0);
  const pinWait = secondsLeft(lockedUntil, now);
  const autoId = slugify(name);
  const previewId = idChoice || autoId;
  const inviteHandle = normalizeHandle(invitedBy || "");

  function resetHandleConflict() {
    setIdChoice("");
    setIdConflict(null);
    setShowHandleChange(false);
  }

  async function finishSession() {
    await queryClient.invalidateQueries({ queryKey: ["me"] });
    login();
    unlockPin();
    notify.success("You're in", "Welcome back to LBPay.");
    router.push("/wallet");
  }

  async function submitSignup(chosenId?: string) {
    const handleToSend = normalizeHandle(chosenId || idChoice || autoId);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        password,
        lbpayId: handleToSend,
      }),
    });
    const data = await readApiJson<AuthApiResponse>(res);
    if (!res.ok) {
      if (data.suggestion) {
        setIdConflict({
          taken: handleToSend,
          suggestion: data.suggestion,
        });
        setIdChoice(data.suggestion);
        setShowHandleChange(false);
        setError("");
        return null;
      }
      throw new Error(data.error || "Could not continue");
    }
    resetHandleConflict();
    return data;
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await readApiJson<AuthApiResponse>(res);
        if (!res.ok) throw new Error(data.error || "Could not continue");
        if (data.step === "otp") {
          notify.info("Check your email", "We sent a 6-digit code.");
          router.push(`/verify?email=${encodeURIComponent(email)}`);
          return;
        }
        if (data.step === "pin-setup") {
          router.push("/pin/setup");
          return;
        }
        setStep("pin");
        return;
      }

      const data = await submitSignup();
      if (!data) return;
      if (data.step === "otp") {
        notify.info("Check your email", "We sent a 6-digit code.");
        router.push(`/verify?email=${encodeURIComponent(email)}`);
        return;
      }
      if (data.step === "pin-setup") {
        router.push("/pin/setup");
        return;
      }
      setStep("pin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function applySuggestedId() {
    if (!idConflict?.suggestion) return;
    setLoading(true);
    setError("");
    try {
      const data = await submitSignup(idConflict.suggestion);
      if (!data) return;
      if (data.step === "otp") {
        notify.info("Check your email", "We sent a 6-digit code.");
        router.push(`/verify?email=${encodeURIComponent(email)}`);
        return;
      }
      if (data.step === "pin-setup") {
        router.push("/pin/setup");
        return;
      }
      setStep("pin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function submitPin(value: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: value, mobile: isMobileClient() }),
      });
      const data = await readApiJson<AuthApiResponse & { retryAfter?: number }>(res);
      if (!res.ok) {
        setError(data.error || "Incorrect PIN");
        setLockedUntil(Number(data.retryAfter) ? Date.now() + Number(data.retryAfter) * 1000 : 0);
        setPin("");
        return;
      }
      await finishSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify PIN");
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  const formNotice =
    notice ||
    (mode === "signup" && inviteHandle ? `@${inviteHandle} invited you to LBPay.` : undefined);

  return (
    <div className="grid min-h-[calc(100svh-var(--header-h))] lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-forest px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">LBPay</p>
          <h2 className="mt-4 max-w-[11ch] text-4xl font-black leading-[1.08] xl:text-5xl">
            {mode === "login" ? "Your XAF wallet, ready." : "Open a wallet in minutes."}
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
            Email, a one-time code, then a PIN. Send across MTN and Orange from one ledger.
          </p>
        </div>
        <p className="relative z-10 text-sm text-white/45">Built for Cameroon.</p>
      </aside>

      <div className="flex flex-col justify-center bg-paper px-6 py-10 md:px-14 lg:px-16">
        {step === "form" ? (
          <div className="mx-auto w-full max-w-[420px]">
            <AuthTitle
              kicker={mode === "login" ? "Welcome back" : "Get started"}
              title={mode === "login" ? "Sign in" : "Create your wallet"}
              subtitle={
                mode === "login"
                  ? "Email and password, then your PIN."
                  : "We will email a one-time code, then you set a PIN."
              }
            />
            <AuthCard>
              <form className="flex flex-col gap-4" onSubmit={submitForm}>
                {mode === "signup" ? (
                  <>
                    <Field label="Full name">
                      <Input
                        name="name"
                        autoComplete="name"
                        placeholder="Amina Ngo"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          resetHandleConflict();
                        }}
                        required
                      />
                    </Field>
                    {previewId ? (
                      <div className="rounded-2xl bg-paper px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                          Your LBPay ID
                        </p>
                        <p className="mt-1 font-mono text-base font-black text-ink">@{previewId}</p>
                      </div>
                    ) : null}
                    {idConflict ? (
                      <div className="space-y-3 rounded-2xl bg-amber-50 p-4">
                        <p className="text-sm font-medium text-ink">
                          @{idConflict.taken} is already taken. @{idConflict.suggestion} is free.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" disabled={loading} onClick={() => void applySuggestedId()}>
                            Use @{idConflict.suggestion}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={loading}
                            onClick={() => {
                              setShowHandleChange(true);
                              setIdChoice(idConflict.suggestion);
                            }}
                          >
                            Change ID
                          </Button>
                        </div>
                        {showHandleChange ? (
                          <Field label="Choose another ID" hint="This one must not already exist.">
                            <div className="relative">
                              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-muted">
                                @
                              </span>
                              <Input
                                name="lbpayId"
                                className="pl-8 font-mono"
                                placeholder={idConflict.suggestion}
                                value={idChoice}
                                onChange={(e) => setIdChoice(normalizeHandle(e.target.value))}
                              />
                            </div>
                          </Field>
                        ) : null}
                      </div>
                    ) : null}
                    <Field label="Phone" hint="9-digit number, no +237">
                      <Input
                        name="tel"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        placeholder="677000000"
                        value={phone}
                        onChange={(e) => setPhone(cameroonMsisdn(e.target.value))}
                        required
                      />
                    </Field>
                  </>
                ) : null}
                <Field label="Email">
                  <Input
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Password">
                  <Input
                    name="password"
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder={mode === "login" ? "Your password" : "At least 6 characters"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
                {mode === "login" ? (
                  <div className="-mt-1 text-right">
                    <Link href="/forgot" className="text-xs font-bold text-brand">
                      Forgot password?
                    </Link>
                  </div>
                ) : null}
                {formNotice ? <p className="text-sm font-semibold text-brand-deep">{formNotice}</p> : null}
                {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
                <Button type="submit" className="mt-1 w-full" disabled={loading}>
                  {loading ? "Please wait…" : mode === "login" ? "Continue" : "Create account"}
                </Button>
              </form>
            </AuthCard>
            <p className="mt-6 text-sm text-muted">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <Link href="/signup" className="font-bold text-brand">
                    Create an account
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link href="/login" className="font-bold text-brand">
                    Sign in
                  </Link>
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[420px]">
            <AuthTitle
              kicker="Confirm"
              title="Enter your PIN"
              subtitle="This confirms it is you."
              align="center"
            />
            <AuthCard>
              <PinPad
                value={pin}
                disabled={pinWait > 0}
                onChange={(next) => {
                  setPin(next);
                  setError("");
                  if (next.length === 4 && pinWait <= 0) void submitPin(next);
                }}
                error={error}
                hint={pinWait > 0 ? `Too many incorrect PINs. Wait ${pinWait}s.` : undefined}
              />
              <Link href="/pin/forgot" className="mt-6 block text-center text-sm font-bold text-brand">
                Forgot PIN?
              </Link>
            </AuthCard>
          </div>
        )}
      </div>
    </div>
  );
}
