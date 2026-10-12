"use client";

import { useEffect, useMemo, useState } from "react";
import { AtSign, Check, Loader2, X } from "lucide-react";
import { HANDLE_MAX, HANDLE_MIN, cleanHandleInput, shortHandleOptions } from "@/lib/handle";
import { cn } from "@/lib/cn";

type HandleCheck =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "ok" }
  | { state: "short" }
  | { state: "taken"; suggestion?: string };

/**
 * Lets someone pick a short LBPay ID while signing up (or changing it later).
 * `value` is what will be sent; "" means "not chosen yet".
 */
export function HandlePicker({
  name,
  value,
  onChange,
  label = "Your LBPay ID",
  hint = "Short and easy to say. People pay you with it.",
  autoPick = true,
  className,
}: {
  name: string;
  value: string;
  onChange: (handle: string) => void;
  label?: string;
  hint?: string;
  /** Pick the first short idea automatically while the user hasn't typed anything. */
  autoPick?: boolean;
  className?: string;
}) {
  const local = useMemo(() => shortHandleOptions(name), [name]);
  const [edited, setEdited] = useState(false);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [check, setCheck] = useState<HandleCheck>({ state: "idle" });
  const shown = value || (autoPick && !edited ? local[0] || "" : "");

  // Keep the parent in sync with the auto-picked idea until the user takes over.
  useEffect(() => {
    if (autoPick && !edited && shown !== value) onChange(shown);
  }, [autoPick, edited, shown, value, onChange]);

  useEffect(() => {
    if (!shown && !name) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (shown.length > 0 && shown.length < HANDLE_MIN) {
        setCheck({ state: "short" });
      } else if (shown) {
        setCheck({ state: "checking" });
      }
      try {
        const res = await fetch(
          `/api/auth/handle?q=${encodeURIComponent(shown)}&name=${encodeURIComponent(name)}`,
          { signal: controller.signal },
        );
        const data = (await res.json()) as {
          available?: boolean;
          reason?: string;
          suggestion?: string;
          ideas?: string[];
        };
        setIdeas(Array.isArray(data.ideas) ? data.ideas : []);
        if (!shown) return setCheck({ state: "idle" });
        if (data.available) return setCheck({ state: "ok" });
        if (data.reason === "short") return setCheck({ state: "short" });
        setCheck({ state: "taken", suggestion: data.suggestion });
        // Never leave an auto-picked ID sitting on a taken name.
        if (!edited && data.suggestion) onChange(data.ideas?.[0] || data.suggestion);
      } catch {
        if (!controller.signal.aborted) setCheck({ state: "idle" });
      }
    }, 350);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [shown, name, edited, onChange]);

  const chips = Array.from(new Set([...ideas, ...(check.state === "taken" && check.suggestion ? [check.suggestion] : [])]))
    .filter((id) => id !== shown)
    .slice(0, 4);

  return (
    <div className={cn("rounded-2xl bg-paper p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="lbpay-handle" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          {label}
        </label>
        <span className="tabular text-[11px] text-muted">
          {shown.length}/{HANDLE_MAX}
        </span>
      </div>
      <div
        className={cn(
          "mt-2 flex items-center gap-2 rounded-xl bg-white px-3 ring-1 transition focus-within:ring-2",
          check.state === "ok" && "ring-brand/40 focus-within:ring-brand/50",
          (check.state === "taken" || check.state === "short") && "ring-danger/40 focus-within:ring-danger/40",
          (check.state === "idle" || check.state === "checking") && "ring-line focus-within:ring-brand/40",
        )}
      >
        <AtSign className="h-4 w-4 shrink-0 text-muted" />
        <input
          id="lbpay-handle"
          name="lbpayId"
          value={shown}
          onChange={(e) => {
            setEdited(true);
            onChange(cleanHandleInput(e.target.value));
          }}
          maxLength={HANDLE_MAX}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="yourname"
          className="h-11 min-w-0 flex-1 bg-transparent font-mono text-[15px] font-bold text-ink outline-none placeholder:font-normal placeholder:text-muted/60"
        />
        <span className="shrink-0" aria-live="polite">
          {check.state === "checking" ? <Loader2 className="h-4 w-4 animate-spin text-muted" aria-label="Checking" /> : null}
          {check.state === "ok" ? (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-white" aria-label="Available">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          ) : null}
          {check.state === "taken" || check.state === "short" ? (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-danger text-white" aria-label="Not available">
              <X className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          ) : null}
        </span>
      </div>
      <p
        className={cn(
          "mt-2 text-xs",
          check.state === "taken" || check.state === "short" ? "text-danger" : "text-muted",
        )}
      >
        {check.state === "taken"
          ? `@${shown} is taken. Try one of these:`
          : check.state === "short"
            ? `At least ${HANDLE_MIN} characters.`
            : check.state === "ok"
              ? `@${shown} is yours if you want it.`
              : hint}
      </p>
      {chips.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setEdited(true);
                onChange(id);
              }}
              className="rounded-full bg-white px-3 py-1.5 font-mono text-[13px] font-semibold text-ink ring-1 ring-line transition hover:ring-brand/50 active:scale-[0.97]"
            >
              @{id}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
