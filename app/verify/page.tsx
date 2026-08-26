"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { useNotify } from "@/lib/notify";

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const notify = useNotify();
  const email = params.get("email") || "";
  const [otp, setOtp] = useState(params.get("dev") || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not verify");
      return;
    }
    notify.success("Email verified", "Now set a 4-digit PIN.");
    router.push("/pin/setup");
  }

  async function resend() {
    const res = await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.devOtp) {
      setOtp(data.devOtp);
      notify.info("Demo code", data.devOtp);
    } else {
      notify.success("Code sent", "Check your inbox.");
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Logo />
      <h1 className="mt-10 text-3xl font-black">Check your email</h1>
      <p className="mt-2 text-muted">We sent a 6-digit code to {email || "your inbox"}.</p>
      <Card className="mt-8 p-6">
        <form className="flex flex-col gap-4" onSubmit={verify}>
          <Field label="Verification code">
            <Input
              inputMode="numeric"
              className="text-center font-mono text-2xl tracking-[0.4em]"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
          </Field>
          {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
          <Button type="submit" disabled={loading || otp.length !== 6}>
            Verify email
          </Button>
          <Button type="button" variant="ghost" onClick={resend}>
            Resend code
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}
