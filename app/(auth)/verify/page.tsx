"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthCard, AuthScreen, AuthTitle } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { readApiJson, type AuthApiResponse } from "@/lib/http";
import { useNotify } from "@/lib/notify";

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const notify = useNotify();
  const email = params.get("email") || "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await readApiJson<AuthApiResponse>(res);
      if (!res.ok) {
        setError(data.error || "Could not verify");
        return;
      }
      notify.success("Email verified", "Now set a 4-digit PIN.");
      router.push("/pin/setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    const res = await fetch("/api/auth/resend-otp", {
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
      <AuthTitle
        kicker="Inbox"
        title="Check your email"
        subtitle={`We sent a 6-digit code to ${email || "your inbox"}.`}
      />
      <AuthCard>
        <form className="flex flex-col gap-4" onSubmit={verify}>
          <Field label="Verification code">
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
          {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
            Verify email
          </Button>
          <Button type="button" variant="ghost" onClick={resend}>
            Resend code
          </Button>
        </form>
      </AuthCard>
    </AuthScreen>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}
