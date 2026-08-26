"use client";

import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "px-3 py-2 text-sm",
        size === "md" && "px-4 py-3 text-[15px]",
        size === "lg" && "px-5 py-3.5 text-base",
        variant === "primary" && "bg-brand text-white shadow-sm hover:bg-brand-dark",
        variant === "secondary" &&
          "border border-line bg-white text-ink hover:border-brand/40 hover:bg-brand-soft",
        variant === "ghost" && "text-muted hover:bg-brand-soft hover:text-brand-dark",
        variant === "dark" && "bg-navy text-white hover:bg-navy/90",
        className,
      )}
      {...props}
    />
  );
}
