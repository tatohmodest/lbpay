import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({
  href = "/",
  className,
  markClassName,
  tone = "light",
}: {
  href?: string;
  className?: string;
  markClassName?: string;
  tone?: "light" | "dark";
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/illustrations/lbpay-mark.webp"
        alt="LBPay"
        width={32}
        height={32}
        className={cn("h-8 w-8 rounded-lg object-cover", markClassName)}
      />
      <span
        className={cn(
          "text-[17px] font-semibold tracking-tight",
          tone === "dark" ? "text-white" : "text-ink",
        )}
      >
        LBPay
      </span>
    </Link>
  );
}
