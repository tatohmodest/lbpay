"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { useNotify } from "@/lib/notify";

export default function AdminOtpPage() {
  const router = useRouter();
  const notify = useNotify();
  const client = useQueryClient();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  async function requestCode() {
    setSending(true);
    setError("");
    const res = await fetch("/api/admin/otp/request", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      notify.error("Could not send code", data.error || "Try again");
      setError(data.error || "Could not send the code");
      return;
    }
    notify.success("Check your email", data.message || "We sent a 6-digit admin code.");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Incorrect code");
      return;
    }
    await client.invalidateQueries({ queryKey: ["admin-session"] });
    notify.success("Admin unlocked", "You can work in the console.");
    router.replace("/admin");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Logo href="/wallet" />
      <h1 className="mt-10 text-3xl font-black">Admin verification</h1>
      <p className="mt-2 text-sm text-muted">
        Send a code to the admin email, then enter it here. Checking that inbox will not lock you out
        with a PIN screen.
      </p>
      <Card className="mt-8 p-6">
        <form className="flex flex-col gap-4" onSubmit={verify}>
          <Field label="6-digit code">
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              className="text-center font-mono text-2xl tracking-[0.4em]"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
          </Field>
          {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
          <Button type="submit" disabled={loading || otp.length !== 6}>
            Open admin
          </Button>
          <Button type="button" variant="ghost" disabled={sending} onClick={() => void requestCode()}>
            {sending ? "Sending…" : "Send code to my email"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
