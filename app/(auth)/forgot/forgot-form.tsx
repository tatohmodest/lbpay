"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard, AuthScreen, AuthTitle } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { readApiJson, type AuthApiResponse } from "@/lib/http";
import { useNotify } from "@/lib/notify";

export function ForgotForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const notify = useNotify();
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await readApiJson<AuthApiResponse & { message?: string }>(res);
      if (!res.ok) throw new Error(data.error || "Could not send the code");
      notify.info("Check your email", data.message || "If an account exists, we sent a 6-digit code.");
      setStep("otp");
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
      const res = await fetch("/api/auth/forgot/verify", {
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

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm }),
      });
      const data = await readApiJson<AuthApiResponse>(res);
      if (!res.ok) throw new Error(data.error || "Could not update password");
      notify.success("Password updated", "Sign in with your new password.");
      router.push("/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    try {
      const data = await readApiJson<AuthApiResponse>(res);
      if (!res.ok) {
        notify.info("Could not resend", data.error || "Try again in a moment.");
        return;
      }
      notify.success("Code sent", "Check your inbox.");
    } catch (err) {
      notify.info("Could not resend", err instanceof Error ? err.message : "Try again.");
    }
  }

  return (
    <AuthScreen>
      {step === "email" ? (
        <>
          <AuthTitle
            kicker="Account"
            title="Forgot password"
            subtitle="Enter the email on your account. We will send a 6-digit code if it matches."
          />
          <AuthCard>
            <form className="flex flex-col gap-4" onSubmit={requestCode}>
              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@email.com"
                  required
                />
              </Field>
              {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait…" : "Send reset code"}
              </Button>
            </form>
          </AuthCard>
        </>
      ) : null}

      {step === "otp" ? (
        <>
          <AuthTitle
            kicker="Inbox"
            title="Check your email"
            subtitle={`We sent a 6-digit code to ${email || "your inbox"}.`}
          />
          <AuthCard>
            <form className="flex flex-col gap-4" onSubmit={verifyCode}>
              <Field label="Reset code">
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
              <Button type="button" variant="ghost" onClick={resend}>
                Resend code
              </Button>
            </form>
          </AuthCard>
        </>
      ) : null}

      {step === "password" ? (
        <>
          <AuthTitle
            kicker="Security"
            title="Set a new password"
            subtitle="Choose a password of 6 or more characters. Your PIN stays the same."
          />
          <AuthCard>
            <form className="flex flex-col gap-4" onSubmit={resetPassword}>
              <Field label="New password">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                />
              </Field>
              <Field label="Confirm password">
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Repeat your new password"
                  minLength={6}
                  required
                />
              </Field>
              {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait…" : "Update password"}
              </Button>
            </form>
          </AuthCard>
        </>
      ) : null}

      <p className="mt-6 text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-bold text-brand">
          Sign in
        </Link>
      </p>
    </AuthScreen>
  );
}
