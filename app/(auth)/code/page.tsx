"use client";

import { useEffect, useState } from "react";
import { AuthCard, AuthScreen, AuthTitle } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { useL } from "@/lib/i18n/use-i18n";

type Reveal = { code: string; purpose: string; exp: number };

/**
 * Opened from the link in a code email. The token sits after "#", so it never
 * reaches server logs; the page asks the server to unseal it and shows the code.
 */
export default function CodePage() {
  const L = useL();
  const [state, setState] = useState<"loading" | "ready" | "expired">("loading");
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = window.location.hash.slice(1);
    (token
      ? fetch("/api/auth/code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
      : Promise.reject(new Error("no token"))
    )
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as Partial<Reveal>;
        if (!res.ok || !data.code) throw new Error("expired");
        setReveal(data as Reveal);
        setState("ready");
      })
      .catch(() => setState("expired"));
  }, []);

  async function copy() {
    if (!reveal) return;
    try {
      await navigator.clipboard.writeText(reveal.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* the code is on screen to type */
    }
  }

  return (
    <AuthScreen>
      <div className="mx-auto w-full max-w-md">
        <AuthCard>
          {state === "ready" && reveal ? (
            <>
              <AuthTitle
                kicker="LBPay"
                title={L("Your code", "Votre code")}
                subtitle={L(
                  "Go back to the LBPay tab or app and enter this code. It expires 10 minutes after it was sent.",
                  "Revenez sur l'onglet ou l'application LBPay et saisissez ce code. Il expire 10 minutes après l'envoi.",
                )}
              />
              <div className="mt-6 rounded-2xl bg-brand-soft py-5 text-center font-mono text-4xl font-black tracking-[0.35em] text-brand-deep">
                {reveal.code}
              </div>
              <Button className="mt-5 w-full" onClick={copy}>
                {copied ? L("Copied", "Copié") : L("Copy code", "Copier le code")}
              </Button>
              <p className="mt-4 text-center text-xs leading-5 text-muted">
                {L(
                  "LBPay will never ask you for this code by phone, SMS or WhatsApp. Never share it.",
                  "LBPay ne vous demandera jamais ce code par téléphone, SMS ou WhatsApp. Ne le partagez jamais.",
                )}
              </p>
            </>
          ) : state === "expired" ? (
            <AuthTitle
              kicker="LBPay"
              title={L("This link has expired", "Ce lien a expiré")}
              subtitle={L(
                "Codes last 10 minutes. Go back to LBPay and ask for a new code.",
                "Les codes durent 10 minutes. Revenez sur LBPay et demandez un nouveau code.",
              )}
            />
          ) : (
            <AuthTitle kicker="LBPay" title={L("Opening your code…", "Ouverture de votre code…")} />
          )}
        </AuthCard>
      </div>
    </AuthScreen>
  );
}
