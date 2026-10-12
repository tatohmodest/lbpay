"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AtSign, X } from "lucide-react";
import { HandlePicker } from "@/components/auth/handle-picker";
import { Button } from "@/components/ui/button";
import { HANDLE_MIN } from "@/lib/handle";
import { useNotify } from "@/lib/notify";
import { celebrate } from "@/components/success-moment";

/** "Change" button + bottom sheet for moving to a shorter LBPay ID. */
export function ChangeHandle({ name, current }: { name: string; current: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const notify = useNotify();
  const onChange = useCallback((next: string) => {
    setValue(next);
    setError("");
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/me/handle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: value }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; user?: { lbpayId?: string } };
      if (!res.ok) throw new Error(data.error || "Could not change your LBPay ID.");
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      setOpen(false);
      notify.success("LBPay ID updated", `You're now @${data.user?.lbpayId || value}`);
      celebrate({
        title: "Say hello to your new ID",
        line: `@${data.user?.lbpayId || value}`,
        note: `Links you already shared with @${current} keep working.`,
        doneLabel: "Love it",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change your LBPay ID.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setValue("");
          setError("");
          setOpen(true);
        }}
        className="inline-flex items-center gap-1 rounded-full bg-paper px-2.5 py-1 text-[11px] font-bold text-ink ring-1 ring-line transition hover:ring-brand/40"
      >
        <AtSign className="h-3 w-3" /> Change ID
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-end bg-forest/60 backdrop-blur-sm md:place-items-center md:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Change your LBPay ID"
          onClick={() => setOpen(false)}
        >
          <div
            className="lb-sheet w-full max-w-md rounded-t-[2rem] bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-left shadow-2xl md:rounded-[2rem] md:pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-deep">Your LBPay ID</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">Pick a shorter one</h2>
                <p className="mt-1 text-sm text-muted">
                  Now <span className="font-mono font-semibold text-ink">@{current}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-paper text-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <HandlePicker
              className="mt-5"
              name={name}
              value={value}
              onChange={onChange}
              autoPick={false}
              label="New LBPay ID"
              hint="Pick an idea below or type your own."
            />

            <ul className="mt-4 space-y-1.5 text-[13px] leading-5 text-muted">
              <li>• Links and QR codes you already shared keep working.</li>
              <li>• Your old ID stays yours, so nobody can pretend to be you.</li>
              <li>• You can change it once every 30 days.</li>
            </ul>

            {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-danger">{error}</p> : null}

            <Button
              className="mt-6 h-12 w-full rounded-2xl"
              disabled={saving || value.length < HANDLE_MIN || value === current}
              onClick={() => void save()}
            >
              {saving ? "Saving…" : value ? `Switch to @${value}` : "Choose an ID"}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
