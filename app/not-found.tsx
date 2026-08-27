import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-6 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">This page is not on the ledger.</h1>
        <Link href="/" className="mt-6 inline-block">
          <Button>Back to LBPay</Button>
        </Link>
      </div>
    </div>
  );
}
