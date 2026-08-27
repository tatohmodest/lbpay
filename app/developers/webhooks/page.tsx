"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNotify } from "@/lib/notify";

export default function WebhooksPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const [url, setUrl] = useState("");
  const data = useQuery({
    queryKey: ["dev-webhooks"],
    queryFn: async () => (await fetch("/api/developer/webhooks")).json(),
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
      notify.success("Webhook added", "We will POST events to this URL.");
    },
    onError: (err: Error) => notify.error("Failed", err.message),
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black">Webhooks</h1>
      <Card className="mt-6 p-5">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Field label="Endpoint URL">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-app.com/webhooks/lbpay" required />
          </Field>
          <Button type="submit">Add webhook</Button>
        </form>
      </Card>
      <div className="mt-4 space-y-3">
        {(data.data?.webhooks || []).map((hook: { id: string; url: string; events: string[]; status: string }) => (
          <Card key={hook.id} className="p-5">
            <p className="font-mono text-sm">{hook.url}</p>
            <p className="mt-2 text-xs text-muted">{hook.events.join(" · ")}</p>
            <p className="mt-2 text-xs font-bold uppercase text-brand">{hook.status}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
