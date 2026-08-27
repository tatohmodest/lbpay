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
  const [loading, setLoading] = useState(false);

  async function finishSession() {
    await queryClient.invalidateQueries({ queryKey: ["me"] });
    login();
    unlockPin();
    notify.success("You're in", "Welcome back to LBPay.");
    router.push("/wallet");
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, lbpayId: name }),
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
      const data = await readApiJson<AuthApiResponse>(res);
      if (!res.ok) {
        setError(data.error || "Incorrect PIN");
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
                      <Input value={name} onChange={(e) => setName(e.target.value)} required />
                    </Field>
                    <Field label="Phone">
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </Field>
                  </>
                ) : null}
                <Field label="Email">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </Field>
                <Field label="Password">
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
              onChange={(next) => {
                setPin(next);
                setError("");
                if (next.length === 4) void submitPin(next);
              }}
              error={error}
            />
          </div>
        )}
      </div>
    </div>
  );
}
