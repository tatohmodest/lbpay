import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({
  href = "/",
  className,
  markClassName,
}: {
  href?: string;
  className?: string;
  markClassName?: string;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <Image
        src="/illustrations/lbpay-mark.png"
        alt="LBPay"
        width={36}
        height={36}
        className={cn("h-9 w-9 rounded-xl object-cover", markClassName)}
      />
      <span className="text-xl font-black tracking-tight text-brand">LBPay</span>
    </Link>
  );
}
