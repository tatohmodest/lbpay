import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-card shadow-[0_1px_2px_rgba(12,25,19,0.04)]",
        className,
      )}
      {...props}
    />
  );
}
