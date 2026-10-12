"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { AuthCard, AuthScreen, AuthTitle } from "@/components/auth-shell";
import { CodeInput } from "@/components/auth/code-input";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { readApiJson, type AuthApiResponse } from "@/lib/http";
import { useNotify } from "@/lib/notify";
import { useI18n } from "@/lib/i18n/use-i18n";
import { cn } from "@/lib/cn";

type Step = "email" | "otp" | "password" | "done";

const RESEND_SECONDS = 30;

function strength(pw: string) {
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
  return score;
}

function Progress({ step, labels }: { step: Step; labels: [string, string, string] }) {
  const index = step === "email" ? 0 : step === "otp" ? 1 : 2;
  return (
    <ol className="mb-8 flex items-center gap-2" aria-label="Progress">
      {labels.map((label, i) => {
        const done = i < index || step === "done";
        const current = i === index && step !== "done";
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold transition",
                done && "bg-brand text-white",
                current && "bg-ink text-white",
                !done && !current && "bg-white text-muted ring-1 ring-line",
              )}
              aria-current={current ? "step" : undefined}
            >
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn("hidden text-[12px] font-semibold sm:block", current ? "text-ink" : "text-muted")}>
              {label}
            </span>
            {i < 2 ? <span className={cn("h-px flex-1", done ? "bg-brand" : "bg-line")} /> : null}
          </li>
        );
      })}
    </ol>
  );
}

export function ForgotForm({ initialEmail = "" }: { initialEmail?: string }) {
  const notify = useNotify();
  const { t } = useI18n();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!resendAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [resendAt]);
  const resendWait = Math.max(0, Math.ceil((resendAt - now) / 1000));

  async function sendCode() {
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await readApiJson<AuthApiResponse & { message?: string }>(res);
    if (!res.ok) throw new Error(data.error || "Could not send the code");
    setResendAt(Date.now() + RESEND_SECONDS * 1000);
  }

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await sendCode();
      setOtp("");
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(code = otp) {
    if (code.length !== 6 || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await readApiJson<AuthApiResponse>(res);
      if (!res.ok) throw new Error(data.error || "Could not verify");
      setStep("password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify");
      setOtp("");
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
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (resendWait > 0) return;
    try {
      await sendCode();
      notify.success(t("forgot.resend"), t("forgot.spamTip"));
    } catch (err) {
      notify.info("Could not resend", err instanceof Error ? err.message : "Try again.");
    }
  }

  const score = strength(password);
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <AuthScreen>
      {step !== "done" ? (
        <Progress step={step} labels={[t("forgot.step1"), t("forgot.step2"), t("forgot.step3")]} />
      ) : null}

      {step === "email" ? (
        <>
          <AuthTitle kicker={t("forgot.step1")} title={t("forgot.titleEmail")} subtitle={t("forgot.subtitleEmail")} />
          <AuthCard>
            <form className="flex flex-col gap-4" onSubmit={requestCode}>
              <Field label={t("forgot.email")}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@email.com"
                  autoFocus
                  required
                />
              </Field>
              {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
              <Button type="submit" className="h-12 w-full" disabled={loading || !email}>
                <Mail className="h-4 w-4" />
                {loading ? t("forgot.wait") : t("forgot.sendCode")}
              </Button>
            </form>
          </AuthCard>
        </>
      ) : null}

      {step === "otp" ? (
        <>
          <AuthTitle
            kicker={t("forgot.step2")}
            title={t("forgot.titleCode")}
            subtitle={t("forgot.subtitleCode", { email: email || "your inbox" })}
          />
          <AuthCard>
            <form
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                void verifyCode();
              }}
            >
              <CodeInput
                value={otp}
                onChange={(next) => {
                  setOtp(next);
                  setError("");
                }}
                onComplete={(code) => void verifyCode(code)}
                disabled={loading}
                error={Boolean(error)}
              />
              {error ? <p className="text-center text-sm font-medium text-danger">{error}</p> : null}
              <p className="text-center text-xs text-muted">{t("forgot.spamTip")}</p>
              <Button type="submit" className="h-12 w-full" disabled={loading || otp.length !== 6}>
                {loading ? t("forgot.wait") : t("forgot.verify")}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError("");
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-muted hover:text-ink"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> {t("forgot.wrongEmail")}
                </button>
                <button
                  type="button"
                  onClick={() => void resend()}
                  disabled={resendWait > 0}
                  className="tabular font-bold text-brand disabled:text-muted"
                >
                  {resendWait > 0 ? t("forgot.resendIn", { seconds: resendWait }) : t("forgot.resend")}
                </button>
              </div>
            </form>
          </AuthCard>
        </>
      ) : null}

      {step === "password" ? (
        <>
          <AuthTitle kicker={t("forgot.step3")} title={t("forgot.titlePassword")} subtitle={t("forgot.subtitlePassword")} />
          <AuthCard>
            <form className="flex flex-col gap-4" onSubmit={resetPassword}>
              <Field label={t("forgot.newPassword")}>
                <div className="relative">
                  <Input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    minLength={6}
                    autoFocus
                    required
                    className="pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1 text-xs font-bold text-brand hover:bg-paper"
                  >
                    {show ? t("forgot.hide") : t("forgot.show")}
                  </button>
                </div>
              </Field>
              {password ? (
                <div aria-live="polite">
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1.5 rounded-full transition",
                          i < score ? (score <= 1 ? "bg-danger" : score === 2 ? "bg-gold" : "bg-brand") : "bg-line",
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-muted">
                    {score <= 1 ? t("forgot.weak") : score === 2 ? t("forgot.okay") : t("forgot.strong")}
                  </p>
                </div>
              ) : null}
              <Field label={t("forgot.confirmPassword")}>
                <Input
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </Field>
              {mismatch ? <p className="text-xs font-medium text-danger">{t("forgot.mismatch")}</p> : null}
              {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
              <Button
                type="submit"
                className="h-12 w-full"
                disabled={loading || password.length < 6 || password !== confirm}
              >
                <KeyRound className="h-4 w-4" />
                {loading ? t("forgot.wait") : t("forgot.save")}
              </Button>
            </form>
          </AuthCard>
        </>
      ) : null}

      {step === "done" ? (
        <AuthCard className="text-center">
          <span className="relative mx-auto grid h-20 w-20 place-items-center">
            <span className="lb-live-dot absolute inset-0 rounded-full bg-brand-soft" />
            <span className="lb-check relative grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-[0_10px_30px_-8px_rgba(0,179,105,0.7)]">
              <Check className="h-7 w-7" strokeWidth={3} />
            </span>
          </span>
          <h1 className="mt-6 text-2xl font-black tracking-tight text-ink">{t("forgot.doneTitle")}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{t("forgot.doneCopy")}</p>
          <Link
            href={`/login?reset=1`}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-ink text-[15px] font-semibold text-white"
          >
            {t("forgot.signIn")}
          </Link>
        </AuthCard>
      ) : null}

      <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-muted">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
        {t("forgot.safety")}
      </p>
      {step !== "done" ? (
        <p className="mt-3 text-sm text-muted">
          {t("forgot.remembered")}{" "}
          <Link href="/login" className="font-bold text-brand">
            {t("forgot.signIn")}
          </Link>
        </p>
      ) : null}
    </AuthScreen>
  );
}
