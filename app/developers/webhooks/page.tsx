"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Copy, Eye, EyeOff, RefreshCw, Send, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNotify } from "@/lib/notify";
import { formatRelative } from "@/lib/format";
import type { WebhookDelivery, WebhookEndpoint } from "@/lib/types";

export default function WebhooksPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const [url, setUrl] = useState("");
  const [txId, setTxId] = useState("");
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const data = useQuery({
    queryKey: ["dev-webhooks"],
    queryFn: async () =>
      (await fetch("/api/developer/webhooks")).json() as Promise<{
        webhooks?: WebhookEndpoint[];
        deliveries?: WebhookDelivery[];
      }>,
  });

  const create = useMutation({
    mutationFn: () =>
      fetch("/api/developer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }).then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        return json;
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["dev-webhooks"] });
      setUrl("");
      notify.success("Webhook added", "Signed events will POST to this URL automatically.");
    },
    onError: (err: Error) => notify.error("Could not add webhook", err.message),
  });

  const testPing = useMutation({
    mutationFn: (id: string) =>
      fetch("/api/developer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", id }),
      }).then(async (res) => {
        const json = await res.json();
        if (!res.ok && !json.delivery) throw new Error(json.error || "Test failed");
        return json as { ok: boolean; delivery: WebhookDelivery };
      }),
    onSuccess: (res) => {
      client.invalidateQueries({ queryKey: ["dev-webhooks"] });
      if (res.ok) {
        notify.success("Test event delivered", `Endpoint responded with HTTP ${res.delivery.status} (${res.delivery.durationMs}ms).`);
      } else {
        notify.error("Endpoint rejected test", res.delivery.error || `HTTP ${res.delivery.status}`);
      }
    },
    onError: (err: Error) => notify.error("Test failed", err.message),
  });

  const resendTx = useMutation({
    mutationFn: () =>
      fetch("/api/developer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", transactionId: txId.trim() }),
      }).then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Resend failed");
        return json as {
          ok: boolean;
          transactionId: string;
          event: string;
          delivered: number;
          matched: number;
          deliveries: WebhookDelivery[];
        };
      }),
    onSuccess: (res) => {
      client.invalidateQueries({ queryKey: ["dev-webhooks"] });
      if (res.delivered > 0) {
        setTxId("");
        notify.success(
          "Webhook resent",
          `Sent ${res.event} for ${res.transactionId} (${res.delivered}/${res.matched} endpoints returned 2xx).`,
        );
      } else {
        const firstErr = res.deliveries[0]?.error || "Endpoint did not return 2xx";
        notify.error("Delivery failed", `${res.event} sent, but endpoint responded: ${firstErr}`);
      }
    },
    onError: (err: Error) => notify.error("Could not resend", err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      fetch("/api/developer/webhooks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        return json;
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["dev-webhooks"] });
      notify.success("Webhook removed", "Events will no longer be sent to that URL.");
    },
    onError: (err: Error) => notify.error("Failed", err.message),
  });

  function copySecret(id: string, secret?: string) {
    if (!secret) return;
    navigator.clipboard.writeText(secret).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    });
  }

  const webhooks = data.data?.webhooks || [];
  const deliveries = data.data?.deliveries || [];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black">Webhooks</h1>
        <p className="mt-1 text-sm text-muted">
          Receive signed real-time HTTP POST events for <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-xs">payment.succeeded</code>,{" "}
          <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-xs">payment.failed</code>,{" "}
          <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-xs">payout.succeeded</code>, and{" "}
          <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-xs">payout.failed</code>.
        </p>
      </div>

      <Card className="p-5">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Field label="HTTPS Endpoint URL">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-app.com/api/webhooks/lbpay"
              required
            />
          </Field>
          <div>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Adding…" : "Add webhook endpoint"}
            </Button>
          </div>
        </form>
      </Card>

      {webhooks.length > 0 ? (
        <div className="space-y-3">
          {webhooks.map((hook) => {
            const revealed = Boolean(revealedIds[hook.id]);
            const masked = hook.secret
              ? `${hook.secret.slice(0, 10)}••••••••••••••••${hook.secret.slice(-4)}`
              : "Generated on next load";
            return (
              <Card key={hook.id} className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-all font-mono text-sm font-semibold text-ink">{hook.url}</p>
                    <p className="mt-1 text-xs text-muted">{hook.events.join(" · ")}</p>
                  </div>
                  <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold uppercase text-brand-dark">
                    {hook.status}
                  </span>
                </div>

                {hook.secret ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                        Signing secret (X-LBPay-Signature)
                      </p>
                      <p className="truncate font-mono text-xs text-ink">
                        {revealed ? hook.secret : masked}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRevealedIds((s) => ({ ...s, [hook.id]: !revealed }))}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-muted hover:text-ink"
                        title={revealed ? "Hide secret" : "Reveal secret"}
                      >
                        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copySecret(hook.id, hook.secret)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-line bg-white px-2.5 text-xs font-semibold text-ink hover:bg-paper"
                      >
                        {copiedId === hook.id ? <Check className="h-3.5 w-3.5 text-brand" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedId === hook.id ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={testPing.isPending}
                    onClick={() => testPing.mutate(hook.id)}
                  >
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Send test event
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-danger hover:bg-red-50"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm(`Remove webhook ${hook.url}?`)) {
                        remove.mutate(hook.id);
                      }
                    }}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      <Card className="p-5">
        <h2 className="text-base font-bold text-ink">Resend webhook for a transaction</h2>
        <p className="mt-1 text-xs text-muted">
          Replay the webhook event for any settled collection or payout on your account using its{" "}
          <code className="font-mono">TXN_...</code> ID or gateway reference.
        </p>
        <form
          className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (txId.trim()) resendTx.mutate();
          }}
        >
          <div className="flex-1">
            <Field label="Transaction ID">
              <Input
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                placeholder="TXN_t60oaw75ox"
                required
              />
            </Field>
          </div>
          <Button type="submit" variant="secondary" disabled={resendTx.isPending || !webhooks.length}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {resendTx.isPending ? "Sending…" : "Resend webhook"}
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Recent deliveries</h2>
        </div>
        {deliveries.length === 0 ? (
          <p className="p-5 text-sm text-muted">No webhook deliveries recorded yet.</p>
        ) : (
          <div className="divide-y divide-line text-sm">
            {deliveries.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        d.ok
                          ? "rounded-md bg-brand-soft px-2 py-0.5 font-mono text-xs font-bold text-brand-dark"
                          : "rounded-md bg-red-50 px-2 py-0.5 font-mono text-xs font-bold text-danger"
                      }
                    >
                      {d.status ? `HTTP ${d.status}` : "ERR"}
                    </span>
                    <span className="font-mono text-xs font-semibold text-ink">{d.event}</span>
                    {d.txId ? <span className="font-mono text-xs text-muted">{d.txId}</span> : null}
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-muted">
                    {d.url}
                    {d.error && !d.ok ? ` · ${d.error}` : ""}
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-muted">
                  <span>{d.durationMs}ms</span> · <span>{formatRelative(d.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
