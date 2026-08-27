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
        "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-colors duration-150 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "h-9 px-4 text-sm",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-12 px-6 text-[15px]",
        variant === "primary" && "bg-brand text-white hover:bg-brand-dark",
        variant === "secondary" &&
          "border border-line bg-white text-ink hover:border-brand/30 hover:bg-paper",
        variant === "ghost" && "text-muted hover:bg-paper hover:text-ink",
        variant === "dark" && "bg-navy text-white hover:bg-navy/90",
        className,
      )}
      {...props}
    />
  );
}
