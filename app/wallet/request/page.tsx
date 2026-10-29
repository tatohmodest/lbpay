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
import { useL } from "@/lib/i18n/use-i18n";
import { formatXAF } from "@/lib/format";
import { payLinkPath, payLinkUrl } from "@/lib/origin";
import { useBrowserOrigin } from "@/lib/use-origin";

export default function RequestPage() {
  const notify = useNotify();
  const L = useL();
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
        body: JSON.stringify({ title: title || L("Money request", "Demande d'argent"), amount: amount ? Number(amount) : null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || L("Could not create request", "Impossible de créer la demande"));
      return json as { link: { slug: string; title: string; amount: number | null; id: string } };
    },
    onSuccess: (json) => {
      const href = payLinkUrl(json.link.slug);
      setLink(href);
      setTitle("");
      setAmount("");
      client.invalidateQueries({ queryKey: ["wallet-links"] });
      notify.success(L("Request ready", "Demande prête"), L("Share the checkout link.", "Partagez le lien de paiement."));
    },
    onError: (err: Error) => notify.error(L("Failed", "Échec"), err.message),
  });

  const links = (data.data?.links || []) as Array<{ id: string; title: string; amount: number | null; slug: string }>;
  const value = Number(amount) || 0;

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link
            href="/wallet/qr"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white ring-1 ring-line/80 transition hover:ring-brand/40"
            aria-label={L("Back", "Retour")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-[1.75rem] font-black leading-tight tracking-tight text-ink">{L("Request money", "Demander de l'argent")}</h1>
            <p className="text-[14px] text-muted">{L("A link with the amount filled in. They pay in two taps.", "Un lien avec le montant déjà rempli. On vous paie en deux gestes.")}</p>
          </div>
        </div>

        {link ? (
          <section className="lb-rise overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-line/80">
            <div className="relative bg-forest px-6 py-7 text-center text-white">
              <div className="lb-glow pointer-events-none absolute inset-0" />
              <span className="lb-check relative mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand text-white">
                <Check className="h-7 w-7" strokeWidth={3} />
              </span>
              <h2 className="relative mt-4 text-2xl font-black">{L("Your request is ready", "Votre demande est prête")}</h2>
              <p className="relative mt-1 text-[14px] text-hero-muted">{L("Send it to the person who owes you.", "Envoyez-la à la personne qui vous doit.")}</p>
            </div>
            <div className="space-y-4 p-5">
              <p className="break-all rounded-2xl bg-paper px-4 py-3 font-mono text-[12px] text-ink">{link}</p>
              <ShareRow url={link} text={L(`Please pay me on LBPay:\n${link}`, `Merci de me payer sur LBPay :\n${link}`)} copyLabel={L("Copy request link", "Copier le lien de demande")} />
              <button
                type="button"
                onClick={() => setLink(null)}
                className="w-full text-center text-[14px] font-semibold text-muted hover:text-ink"
              >
                {L("Make another request", "Faire une autre demande")}
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
              <Field label={L("What is it for?", "C'est pour quoi ?")}>
                <Input
                  placeholder={L("e.g. Share of the dinner", "ex. Ma part du dîner")}
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
                label={L("How much?", "Combien ?")}
                receive={value}
                fee={0}
                receiveLabel={L("You receive", "Vous recevez")}
                feeLabel={L("Fee for you", "Frais pour vous")}
              />
              <Button type="submit" disabled={create.isPending || !value || !title.trim()} className="h-14 rounded-2xl text-[16px] font-bold">
                {create.isPending ? L("Creating…", "Création…") : value ? L(`Request ${formatXAF(value)}`, `Demander ${formatXAF(value)}`) : L("Create request", "Créer la demande")}
              </Button>
            </form>
          </section>
        )}
        <p className="px-1 text-center text-[12px] text-muted">
          {L("They can pay with MTN MoMo, Orange Money or an LBPay wallet.", "On peut vous payer par MTN MoMo, Orange Money ou un portefeuille LBPay.")}
        </p>
      </div>

      <div>
        <h2 className="mb-3 px-1 text-[13px] font-bold uppercase tracking-[0.14em] text-muted">{L("Your requests", "Vos demandes")}</h2>
        {links.length === 0 ? (
          <div className="rounded-[1.75rem] border-2 border-dashed border-line bg-white px-6 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-deep">
              <Send className="h-5 w-5" />
            </span>
            <p className="mt-3 text-[15px] font-bold text-ink">{L("No requests yet", "Aucune demande pour l'instant")}</p>
            <p className="mt-1 text-[13px] text-muted">{L("Requests you create show up here.", "Vos demandes apparaîtront ici.")}</p>
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
                    {item.amount ? formatXAF(item.amount) : L("Any", "Libre")}
                  </span>
                </div>
                <div className="flex gap-2 px-4 pb-4">
                  <Link
                    href={payLinkPath(item.slug)}
                    className="flex-1 rounded-xl bg-paper py-2 text-center text-[12px] font-semibold text-ink ring-1 ring-line hover:ring-brand/40"
                  >
                    {L("View", "Voir")}
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      void copyText(payLinkUrl(item.slug, origin)).then(() => notify.success(L("Copied", "Copié"), L("Send it on WhatsApp.", "Envoyez-le sur WhatsApp.")))
                    }
                    className="flex-1 rounded-xl bg-ink py-2 text-center text-[12px] font-semibold text-white hover:bg-ink/90"
                  >
                    {L("Copy link", "Copier le lien")}
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
