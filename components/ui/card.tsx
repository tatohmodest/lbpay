import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-card shadow-[0_4px_20px_rgba(0,179,105,0.04)]",
        className,
      )}
      {...props}
    />
  );
}
