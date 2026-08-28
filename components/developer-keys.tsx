"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/cn";
import { useNotify } from "@/lib/notify";

type Env = "sandbox" | "live";
type KeyRow = {
  id: string;
  env: Env;
  publicKey: string;
  secretMasked: string;
};

export function DeveloperKeysPanel() {
  const notify = useNotify();
  const client = useQueryClient();
  const [env, setEnv] = useState<Env>("sandbox");
  const [freshSecret, setFreshSecret] = useState("");
  const [copied, setCopied] = useState("");
  const data = useQuery({
    queryKey: ["dev-keys"],
    queryFn: async () => (await fetch("/api/developer/keys")).json() as Promise<{
      keys: KeyRow[];
      liveReady?: boolean;
    }>,
  });
  const rotate = useMutation({
    mutationFn: (nextEnv: Env) =>
      fetch("/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env: nextEnv }),
      }).then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        return json as { secret: string; publicKey: string; secretMasked: string; env: Env };
      }),
    onSuccess: (json) => {
      client.invalidateQueries({ queryKey: ["dev-keys"] });
      setFreshSecret(json.secret);
      notify.success("Copy this secret now", "The old secret for this mode no longer works.");
    },
    onError: (err: Error) => notify.error("Failed", err.message),
  });

  const keys = data.data?.keys || [];
  const current = keys.find((key) => key.env === env);
  const hasLive = keys.some((key) => key.env === "live");

  async function copy(label: string, value: string) {
    try {
      await copyText(value);
      setCopied(label);
      notify.success("Copied", label);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      notify.error("Could not copy", "Select the value and copy it yourself.");
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 rounded-2xl bg-paper p-1">
        {(["sandbox", "live"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setEnv(item);
              setFreshSecret("");
            }}
            className={cn(
              "rounded-xl py-2.5 text-sm font-semibold capitalize",
              env === item ? "bg-white text-ink shadow-sm" : "text-muted",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <Card className="mt-4 bg-navy p-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-white/60">{env} keys</p>
          <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase">{env}</span>
        </div>
        {current ? (
          <>
            <p className="mt-4 text-xs font-bold uppercase text-white/60">Publishable</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="break-all font-mono text-sm">{current.publicKey}</p>
              <button type="button" onClick={() => void copy("Publishable key", current.publicKey)}>
                {copied === "Publishable key" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4 opacity-70" />}
              </button>
            </div>
            <p className="mt-4 text-xs font-bold uppercase text-white/60">Secret</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="break-all font-mono text-sm">{freshSecret || current.secretMasked}</p>
              {freshSecret ? (
                <button type="button" onClick={() => void copy("Secret key", freshSecret)}>
                  {copied === "Secret key" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4 opacity-70" />}
                </button>
              ) : null}
            </div>
            {freshSecret ? (
              <p className="mt-3 text-xs text-brand">Copy it now. You will not see this secret again.</p>
            ) : null}
          </>
        ) : (
          <p className="mt-4 text-sm text-white/70">
            {env === "live" ? "No live key yet." : "No sandbox key yet."}
          </p>
        )}
        <Button
          className="mt-5 w-full"
          variant="secondary"
          disabled={rotate.isPending}
          onClick={() => rotate.mutate(env)}
        >
          {rotate.isPending
            ? "Please wait…"
            : current
              ? "Regenerate key"
              : env === "live"
                ? "Get live key"
                : "Get sandbox key"}
        </Button>
      </Card>
      {env === "live" && !hasLive ? (
        <p className="mt-3 text-sm text-muted">Live uses sk_live_ keys. Sandbox stays on sk_test_.</p>
      ) : null}
    </div>
  );
}
