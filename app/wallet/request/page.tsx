"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Send } from "lucide-react";
import { AmountField } from "@/components/amount-field";
import { ShareRow } from "@/components/share-row";
import { copyText } from "@/lib/clipboard";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNotify } from "@/lib/notify";
import { formatXAF } from "@/lib/format";
import { payLinkPath, payLinkUrl } from "@/lib/origin";
import { useBrowserOrigin } from "@/lib/use-origin";

export default function RequestPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const origin = useBrowserOrigin();
  const data = useQuery({
    queryKey: ["wallet-links"],
    queryFn: async () => (await fetch("/api/wallet/links")).json(),
  });
  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/wallet/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || "Money request", amount: amount ? Number(amount) : null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not create request");
      return json as { link: { slug: string; title: string; amount: number | null; id: string } };
    },
    onSuccess: (json) => {
      const href = payLinkUrl(json.link.slug);
      setLink(href);
      setTitle("");
      setAmount("");
      client.invalidateQueries({ queryKey: ["wallet-links"] });
      notify.success("Request ready", "Share the checkout link.");
    },
    onError: (err: Error) => notify.error("Failed", err.message),
  });

  const links = (data.data?.links || []) as Array<{ id: string; title: string; amount: number | null; slug: string }>;
  const value = Number(amount) || 0;

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link
            href="/wallet/qr"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white ring-1 ring-line/80 transition hover:ring-brand/40"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-[1.75rem] font-black leading-tight tracking-tight text-ink">Request money</h1>
            <p className="text-[14px] text-muted">A link with the amount filled in. They pay in two taps.</p>
          </div>
        </div>

        {link ? (
          <section className="lb-rise overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-line/80">
            <div className="relative bg-forest px-6 py-7 text-center text-white">
              <div className="lb-glow pointer-events-none absolute inset-0" />
              <span className="lb-check relative mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand text-white">
                <Check className="h-7 w-7" strokeWidth={3} />
              </span>
              <h2 className="relative mt-4 text-2xl font-black">Your request is ready</h2>
              <p className="relative mt-1 text-[14px] text-hero-muted">Send it to the person who owes you.</p>
            </div>
            <div className="space-y-4 p-5">
              <p className="break-all rounded-2xl bg-paper px-4 py-3 font-mono text-[12px] text-ink">{link}</p>
              <ShareRow url={link} text={`Please pay me on LBPay:\n${link}`} copyLabel="Copy request link" />
              <button
                type="button"
                onClick={() => setLink(null)}
                className="w-full text-center text-[14px] font-semibold text-muted hover:text-ink"
              >
                Make another request
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-[1.75rem] bg-white p-5 ring-1 ring-line/80 sm:p-6">
            <form
              className="flex flex-col gap-6"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate();
              }}
            >
              <Field label="What is it for?">
                <Input
                  placeholder="e.g. Share of the dinner"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={60}
                  className="h-12 text-[16px] font-semibold"
                  required
                />
              </Field>
              <AmountField
                value={amount}
                onChange={setAmount}
                kind="wallet"
                label="How much?"
                receive={value}
                fee={0}
                receiveLabel="You receive"
                feeLabel="Fee for you"
              />
              <Button type="submit" disabled={create.isPending || !value || !title.trim()} className="h-14 rounded-2xl text-[16px] font-bold">
                {create.isPending ? "Creating…" : value ? `Request ${formatXAF(value)}` : "Create request"}
              </Button>
            </form>
          </section>
        )}
        <p className="px-1 text-center text-[12px] text-muted">
          They can pay with MTN MoMo, Orange Money or an LBPay wallet.
        </p>
      </div>

      <div>
        <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-[0.14em] text-muted">Your requests</h2>
        {links.length === 0 ? (
          <div className="rounded-[1.75rem] border-2 border-dashed border-line bg-white px-6 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-deep">
              <Send className="h-5 w-5" />
            </span>
            <p className="mt-3 text-[15px] font-bold text-ink">No requests yet</p>
            <p className="mt-1 text-[13px] text-muted">Requests you create show up here.</p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-line/80">
            {links.map((item, i) => (
              <li key={item.id} className={i ? "border-t border-line" : ""}>
                <div className="flex items-center gap-3 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper text-[13px] font-black text-ink ring-1 ring-line">
                    {item.title.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-ink">{item.title}</span>
                    <span className="block truncate font-mono text-[11px] text-muted">{payLinkUrl(item.slug, origin)}</span>
                  </span>
                  <span className="tabular shrink-0 text-[14px] font-black text-ink">
                    {item.amount ? formatXAF(item.amount) : "Any"}
                  </span>
                </div>
                <div className="flex gap-2 px-4 pb-4">
                  <Link
                    href={payLinkPath(item.slug)}
                    className="flex-1 rounded-xl bg-paper py-2 text-center text-[12px] font-semibold text-ink ring-1 ring-line hover:ring-brand/40"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      void copyText(payLinkUrl(item.slug, origin)).then(() => notify.success("Copied", "Send it on WhatsApp."))
                    }
                    className="flex-1 rounded-xl bg-ink py-2 text-center text-[12px] font-semibold text-white hover:bg-ink/90"
                  >
                    Copy link
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
