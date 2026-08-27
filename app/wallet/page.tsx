"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Phone,
  QrCode,
  Receipt,
  Send,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate, formatXAF, isMoneyOut } from "@/lib/format";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import { VerifyPrompt } from "@/components/verify-prompt";
import type { Transaction } from "@/lib/types";

const actions = [
  { href: "/wallet/send", label: "Send Money", icon: Send },
  { href: "/wallet/request", label: "Receive Money", icon: WalletCards },
  { href: "/wallet/qr", label: "QR Code", icon: QrCode },
  { href: "/wallet/history", label: "Transactions", icon: History },
];

export default function WalletPage() {
  const { state } = useApp();
  const me = useMe();
  const balance = me.data?.balance ?? state.balance;
  const transactions = (me.data?.transactions as Transaction[] | undefined) ?? state.transactions;
  const frozen = (me.data?.user?.status || state.user.status) === "frozen";
  const personalKyc = me.data?.user?.kyc?.personal || "unverified";

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {frozen ? (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-danger lg:col-span-12">
          This account is frozen. Deposits, sends, and withdrawals are blocked until an admin restores it.
        </div>
      ) : null}
      <VerifyPrompt userId={me.data?.user?.id} status={personalKyc} />
      <div className="flex flex-col gap-6 lg:col-span-8">
        <section className="relative overflow-hidden rounded-3xl bg-brand p-6 text-white shadow-lg">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-sm text-white/80">Wallet Balance</p>
              <h1 className="mt-1 text-4xl font-semibold tracking-tight md:text-5xl">
                {formatXAF(balance, { withCurrency: false })}{" "}
                <span className="text-2xl font-semibold opacity-80">XAF</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-mono">
              @{state.user.lbpayId}
            </div>
          </div>
          <div className="relative z-10 mt-8 grid grid-cols-2 gap-3">
            <Link href="/wallet/deposit">
              <Button className="w-full bg-white text-brand hover:bg-brand-soft">
                <ArrowDownLeft className="h-4 w-4" /> Deposit
              </Button>
            </Link>
            <Link href="/wallet/withdraw">
              <Button className="w-full border border-white/30 bg-white/10 text-white hover:bg-white/20">
                <ArrowUpRight className="h-4 w-4" /> Withdraw
              </Button>
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {actions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="flex h-full flex-col items-center gap-3 p-5 transition hover:border-brand/40 hover:shadow-[0_10px_30px_rgba(0,179,105,0.12)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold">{action.label}</span>
              </Card>
            </Link>
          ))}
        </div>
        <div className="flex gap-4 text-sm font-semibold">
          <Link href="/wallet/airtime" className="inline-flex items-center gap-1 text-brand">
            <Phone className="h-4 w-4" /> Buy Airtime
          </Link>
          <Link href="/wallet/bills" className="inline-flex items-center gap-1 text-brand">
            <Receipt className="h-4 w-4" /> Pay Bills
          </Link>
        </div>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
              Recent activity
            </h2>
            <Link href="/wallet/history" className="text-sm font-bold text-brand">
              View all
            </Link>
          </div>
          <div className="divide-y divide-line">
            {transactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No movements yet. Deposit or receive to get started.</p>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold">{tx.counterparty}</p>
                    <p className="text-xs text-muted">
                      {tx.kind.replace("_", " ")} · {formatDate(tx.createdAt)}
                      {tx.fee > 0 ? ` · fee ${formatXAF(tx.fee, { withCurrency: false })}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">
                      {isMoneyOut(tx.kind) ? "−" : "+"}
                      {formatXAF(tx.amount, { withCurrency: false })}
                    </p>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-4">
        <Card className="p-5">
          <h2 className="text-lg font-bold">Send out of LBPay</h2>
          <p className="mt-1 text-sm text-muted">
            Disburse wallet cash to MTN or Orange. Same network 3%, Orange to MTN or MTN to Orange 6%.
            Wallet-to-wallet stays inside LBPay and is free.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-full bg-mtn px-2 py-1 text-[10px] font-black text-black">MTN</span>
            <span className="text-muted">→</span>
            <span className="rounded-full bg-om px-2 py-1 text-[10px] font-black text-white">OM</span>
          </div>
          <div className="mt-4 grid gap-2">
            <Link href="/wallet/send?via=mtn">
              <Button className="w-full" variant="secondary">
                Disburse to MTN
              </Button>
            </Link>
            <Link href="/wallet/send?via=orange">
              <Button className="w-full">Disburse to Orange</Button>
            </Link>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <Image
            src="/illustrations/cross-network.png"
            alt="MTN to Orange"
            width={800}
            height={540}
            className="h-40 w-full object-cover"
          />
          <div className="p-4">
            <p className="text-sm font-semibold">Receive with QR or @handle</p>
            <Link href="/wallet/qr" className="mt-2 inline-block text-sm font-bold text-brand">
              Show my QR
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
