import { cn } from "@/lib/cn";
import type { PaymentMethod, TransactionStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        status === "success" && "bg-brand-soft text-brand-dark",
        status === "pending" && "bg-amber-50 text-amber-700",
        status === "failed" && "bg-red-50 text-danger",
        status === "cancelled" && "bg-zinc-100 text-zinc-500",
        status === "expired" && "bg-zinc-100 text-zinc-500",
      )}
    >
      {status}
    </span>
  );
}

export function MethodDot({ method }: { method: PaymentMethod }) {
  const label =
    method === "mtn"
      ? "MTN MoMo"
      : method === "orange"
        ? "Orange Money"
        : method === "card"
          ? "Card"
          : "LBPay Wallet";
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          method === "mtn" && "bg-mtn",
          method === "orange" && "bg-om",
          method === "card" && "bg-sky-500",
          method === "wallet" && "bg-brand",
        )}
      />
      {label}
    </span>
  );
}
