import { formatXAF } from "@/lib/format";
import { productPricing } from "@/lib/shop";
import { cn } from "@/lib/cn";

export function SaleBadge({
  percentOff,
  className,
}: {
  percentOff?: number | null;
  className?: string;
}) {
  if (!percentOff) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-white/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-black text-emerald-800 shadow-[0_4px_14px_rgba(0,0,0,0.1)] ring-1 ring-black/5",
        className,
      )}
    >
      −{percentOff}%
    </span>
  );
}

export function ProductPrice({
  amount,
  compareAtAmount,
  size = "md",
  badge = true,
  className,
}: {
  amount?: number | null;
  compareAtAmount?: number | null;
  size?: "sm" | "md" | "lg";
  badge?: boolean;
  className?: string;
}) {
  const { price, original, onSale, percentOff } = productPricing(amount, compareAtAmount);
  const priceClass =
    size === "lg"
      ? "text-[1.85rem] leading-none sm:text-[2.15rem]"
      : size === "sm"
        ? "text-base leading-none"
        : "text-[1.4rem] leading-none";

  if (!price) {
    return (
      <p className={cn("font-mono font-black text-brand", priceClass, className)}>Open amount</p>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2.5 gap-y-1", className)}>
      <p className={cn("font-mono font-black text-ink", priceClass)}>{formatXAF(price)}</p>
      {onSale && original ? (
        <>
          <p
            className={cn(
              "font-mono font-semibold text-muted/70 line-through decoration-ink/30",
              size === "lg" ? "text-base" : "text-sm",
            )}
          >
            {formatXAF(original)}
          </p>
          {badge ? (
            <SaleBadge percentOff={percentOff} className={size === "sm" ? "hidden" : undefined} />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
