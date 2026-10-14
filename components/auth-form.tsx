"use client";

import { Lock, ShieldCheck } from "lucide-react";
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
import { HandlePicker } from "@/components/auth/handle-picker";
import { consumeAuthNext } from "@/lib/auth-next";
import { useI18n } from "@/lib/i18n/use-i18n";

export function AuthForm({
  mode,
  notice,
  invitedBy,
  initialEmail,
}: {
  mode: "login" | "signup";
  notice?: string;
  invitedBy?: string;
  initialEmail?: string;
}) {
  const router = useRouter();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { login, unlockPin } = useApp();
  const [step, setStep] = useState<"form" | "pin">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail || "");
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
  const inviteHandle = normalizeHandle(invitedBy || "");
  const { t } = useI18n();

  function resetHandleConflict() {
    setIdChoice("");
    setIdConflict(null);
    setShowHandleChange(false);
  }

  async function finishSession() {
    await queryClient.invalidateQueries({ queryKey: ["me"] });
    login();
    unlockPin();
    notify.success(t("auth.youreIn"), t("auth.welcomeBack"));
    router.push(consumeAuthNext("/wallet"));
  }

  async function submitSignup(chosenId?: string) {
    const handleToSend = normalizeHandle(chosenId || idChoice);
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
      throw new Error(data.error || t("errors.couldNotContinue"));
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
        if (!res.ok) throw new Error(data.error || t("errors.couldNotContinue"));
        if (data.step === "otp") {
          notify.info(t("auth.checkEmail"), t("auth.codeSent"));
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
        notify.info(t("auth.checkEmail"), t("auth.codeSentSignup"));
        router.push(`/verify?email=${encodeURIComponent(email)}`);
        return;
      }
      if (data.step === "pin-setup") {
        router.push("/pin/setup");
        return;
      }
      setStep("pin");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.somethingWrong"));
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
        notify.info(t("auth.checkEmail"), t("auth.codeSentSignup"));
        router.push(`/verify?email=${encodeURIComponent(email)}`);
        return;
      }
      if (data.step === "pin-setup") {
        router.push("/pin/setup");
        return;
      }
      setStep("pin");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.somethingWrong"));
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
    (mode === "signup" && inviteHandle ? t("auth.invited", { handle: inviteHandle }) : undefined);

  return (
    <div className="grid min-h-[calc(100svh-var(--header-h))] lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-forest px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="lb-glow pointer-events-none absolute inset-0" />
        <div className="lb-grid-bg pointer-events-none absolute inset-0" />
        <div className="relative z-10 lb-rise">
          <h2 className="max-w-[12ch] text-[2.75rem] font-bold leading-[1.05] tracking-[-0.03em] xl:text-[3.5rem]">
            {mode === "login" ? (
              t("auth.asideLogin")
            ) : (
              <>
                {t("auth.asideSignup")}{" "}
                <span className="font-display font-normal italic text-brand">{t("auth.asideAccent")}</span>
              </>
            )}
          </h2>
          <p className="mt-5 max-w-sm text-[16px] leading-7 text-hero-muted">{t("auth.asideCopy")}</p>
          <ul className="mt-10 space-y-3">
            {(["auth.trust1", "auth.trust2", "auth.trust3", "auth.trust4"] as const).map((key, i) => (
              <li
                key={key}
                className="lb-rise flex max-w-sm items-center gap-3 rounded-2xl bg-white/[0.05] px-4 py-3 text-[14px] text-white/85 ring-1 ring-white/10"
                style={{ animationDelay: `${150 + i * 100}ms` }}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/20 text-brand">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-[13px] text-white/45">{t("auth.builtFor")}</p>
      </aside>

      <div className="flex flex-col justify-center bg-paper px-6 py-10 md:px-14 lg:px-16">
        {step === "form" ? (
          <div className="mx-auto w-full max-w-[420px]">
            <AuthTitle
              kicker={mode === "login" ? t("auth.kickerLogin") : t("auth.kickerSignup")}
              title={mode === "login" ? t("auth.titleLogin") : t("auth.titleSignup")}
              subtitle={mode === "login" ? t("auth.subtitleLogin") : t("auth.subtitleSignup")}
            />
            <AuthCard>
              <form
                className="flex flex-col gap-4"
                method="post"
                action="/signup"
                onSubmit={submitForm}
              >
                {mode === "signup" ? (
                  <>
                    <Field label={t("auth.fullName")}>
                      <Input
                        name="name"
                        autoComplete="name"
                        placeholder="Amina Ngo"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setIdConflict(null);
                          setShowHandleChange(false);
                        }}
                        required
                      />
                    </Field>
                    <HandlePicker
                      name={name}
                      value={idChoice}
                      onChange={setIdChoice}
                      label={t("auth.yourId")}
                    />
                    {idConflict ? (
                      <div className="space-y-3 rounded-2xl bg-amber-50 p-4">
                        <p className="text-sm font-medium text-ink">
                          {t("auth.idTaken", { taken: idConflict.taken, suggestion: idConflict.suggestion })}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" disabled={loading} onClick={() => void applySuggestedId()}>
                            {t("auth.useId", { id: idConflict.suggestion })}
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
                            {t("auth.changeId")}
                          </Button>
                        </div>
                        {showHandleChange ? (
                          <Field label={t("auth.chooseId")} hint={t("auth.chooseIdHint")}>
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
                    <Field label={t("auth.phone")} hint={t("auth.phoneHint")}>
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
                <Field label={t("auth.email")}>
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
                <Field label={t("auth.password")}>
                  <Input
                    name="password"
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder={mode === "login" ? t("auth.passwordHintLogin") : t("auth.passwordHintSignup")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
                {mode === "login" ? (
                  <div className="-mt-1 text-right">
                    <Link href="/forgot" className="text-xs font-bold text-brand">
                      {t("auth.forgotPassword")}
                    </Link>
                  </div>
                ) : null}
                {formNotice ? <p className="text-sm font-semibold text-brand-deep">{formNotice}</p> : null}
                {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
                <Button type="submit" className="mt-1 w-full" disabled={loading}>
                  {loading ? t("auth.pleaseWait") : mode === "login" ? t("auth.continue") : t("auth.createAccount")}
                </Button>
                {mode === "signup" ? (
                  <p className="text-center text-xs text-muted">
                    {t("auth.signupEmailHint")}
                  </p>
                ) : null}
                <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-muted">
                  <Lock className="h-3 w-3" />
                  {t("auth.privacyNote")}{" "}
                  <Link href="/privacy" className="font-semibold text-ink underline-offset-2 hover:underline">
                    {t("auth.privacyLink")}
                  </Link>
                </p>
              </form>
            </AuthCard>
            <p className="mt-6 text-sm text-muted">
              {mode === "login" ? (
                <>
                  {t("auth.newHere")}{" "}
                  <Link href="/signup" className="font-bold text-brand">
                    {t("auth.createAnAccount")}
                  </Link>
                </>
              ) : (
                <>
                  {t("auth.alreadyHave")}{" "}
                  <Link href="/login" className="font-bold text-brand">
                    {t("auth.signIn")}
                  </Link>
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[420px]">
            <AuthTitle
              kicker="PIN"
              title={t("auth.enterPin")}
              subtitle={t("auth.confirmItIsYou")}
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
                hint={pinWait > 0 ? t("auth.pinWait", { seconds: pinWait }) : undefined}
              />
              <Link href="/pin/forgot" className="mt-6 block text-center text-sm font-bold text-brand">
                {t("auth.forgotPin")}
              </Link>
            </AuthCard>
          </div>
        )}
      </div>
    </div>
  );
}
