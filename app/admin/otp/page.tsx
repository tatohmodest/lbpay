"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-paper px-6 py-10">
      <div className="mx-auto w-full max-w-md">
        <Logo href="/wallet" />
        <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Admin</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Verification</h1>
        <p className="mt-2 text-sm text-muted">
          Send a code to the admin email, then enter it here. Checking that inbox will not lock you out with a PIN
          screen.
        </p>
        <form
          className="mt-6 space-y-4 rounded-[1.25rem] border border-line/80 bg-white p-5 shadow-[0_1px_2px_rgba(12,25,19,0.04)]"
          onSubmit={verify}
        >
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
          <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
            Open admin
          </Button>
          <Button type="button" variant="ghost" className="w-full" disabled={sending} onClick={() => void requestCode()}>
            {sending ? "Sending…" : "Send code to my email"}
          </Button>
        </form>
      </div>
    </div>
  );
}
