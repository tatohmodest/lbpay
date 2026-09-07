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
        "rounded-full bg-gold px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#2a1d00] shadow-[0_8px_18px_rgba(201,164,92,0.35)]",
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
        : "text-[1.45rem] leading-none";

  if (!price) {
    return (
      <p className={cn("font-mono font-black text-brand", priceClass, className)}>Open amount</p>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-end gap-x-2.5 gap-y-1", className)}>
      <p className={cn("font-mono font-black text-brand", priceClass)}>{formatXAF(price)}</p>
      {onSale && original ? (
        <>
          <p
            className={cn(
              "font-mono font-semibold text-muted/80 line-through decoration-ink/35",
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
