import { cn } from "@/lib/cn";

export function MtnMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ffcc00] text-[11px] font-black tracking-tight text-black",
        className,
      )}
      aria-hidden
    >
      MTN
    </span>
  );
}

export function OrangeMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ff7900] text-[10px] font-black tracking-tight text-white",
        className,
      )}
      aria-hidden
    >
      OM
    </span>
  );
}

export function CardMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#1a1f71] text-[9px] font-black tracking-tight text-white",
        className,
      )}
      aria-hidden
    >
      CARD
    </span>
  );
}

export function WalletMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand text-[9px] font-black tracking-tight text-white",
        className,
      )}
      aria-hidden
    >
      LB
    </span>
  );
}

export function NetworkMark({
  network,
  className,
}: {
  network: "mtn" | "orange" | "card" | "wallet";
  className?: string;
}) {
  if (network === "mtn") return <MtnMark className={className} />;
  if (network === "orange") return <OrangeMark className={className} />;
  if (network === "card") return <CardMark className={className} />;
  return <WalletMark className={className} />;
}
