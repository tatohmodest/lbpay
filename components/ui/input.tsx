import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border-0 bg-paper px-4 py-3.5 text-sm font-medium text-ink outline-none transition placeholder:text-muted/60 focus:bg-white focus:ring-4 focus:ring-brand/15 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[7.5rem] w-full resize-y rounded-2xl border-0 bg-paper px-4 py-3.5 text-sm font-medium text-ink outline-none transition placeholder:text-muted/60 focus:bg-white focus:ring-4 focus:ring-brand/15 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
