import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper p-6 text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-brand">404</p>
        <h1 className="mt-2 text-3xl font-black">This page is not on the ledger.</h1>
        <Link href="/" className="mt-4 inline-block font-semibold text-brand">
          Back to LBPay
        </Link>
      </div>
    </div>
  );
}
