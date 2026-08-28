"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
}: {
  mode: "login" | "signup";
  notice?: string;
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
      body: JSON.stringify({ name, email, phone, password, lbpayId: handleToSend }),
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

  async function useSuggestedId() {
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

  return (
    <div className="grid min-h-[calc(100svh-var(--header-h))] lg:grid-cols-2">
      <div className="relative order-1 h-52 overflow-hidden bg-paper sm:h-64 lg:order-2 lg:h-auto">
        <Image
          src="/illustrations/hero-send-money.png"
          alt="Send money in Cameroon with LBPay"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="order-2 flex flex-col justify-center px-6 py-10 md:px-16 lg:order-1">
        {step === "form" ? (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">
              {mode === "login" ? "Sign in" : "Create your wallet"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              {mode === "login"
                ? "Email and password, then your PIN."
                : "We will email a one-time code, then you set a PIN."}
            </p>
            <Card className="mt-8 p-6">
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
                        <p className="mt-1 font-mono text-base font-semibold text-ink">@{previewId}</p>
                        {!idConflict ? (
                          <p className="mt-1 text-sm text-muted">
                            Created from your name. You do not type it.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {idConflict ? (
                      <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-medium text-ink">
                          @{idConflict.taken} is already taken. @{idConflict.suggestion} is free.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" disabled={loading} onClick={() => void useSuggestedId()}>
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
                    <Link href="/forgot" className="text-xs font-medium text-brand-deep">
                      Forgot password?
                    </Link>
                  </div>
                ) : null}
                {notice ? (
                  <p className="text-sm font-medium text-brand-deep">{notice}</p>
                ) : null}
                {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
                <Button type="submit" disabled={loading}>
                  {loading ? "Please wait…" : mode === "login" ? "Continue" : "Create account"}
                </Button>
              </form>
            </Card>
            <p className="mt-6 text-sm text-muted">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <Link href="/signup" className="font-medium text-brand-deep">
                    Create an account
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-brand-deep">
                    Sign in
                  </Link>
                </>
              )}
            </p>
          </>
        ) : (
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Enter your PIN</h1>
            <p className="mt-2 mb-6 text-sm text-muted">This confirms it is you.</p>
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
            <Link href="/pin/forgot" className="mt-6 block text-center text-sm font-semibold text-brand">
              Forgot PIN?
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
