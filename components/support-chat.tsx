"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { useNotify } from "@/lib/notify";
import { cn } from "@/lib/cn";

type SupportMessage = {
  id: string;
  author: "user" | "admin";
  body: string;
  createdAt: string;
};

type SupportThread = {
  id: string;
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  unread: number;
};

export function SupportChat({
  endpoint,
  emptyTitle,
  emptyCopy,
  composerLabel,
  mine = "user",
  onSent,
}: {
  endpoint: string;
  emptyTitle: string;
  emptyCopy: string;
  composerLabel: string;
  mine?: "user" | "admin";
  onSent?: () => void;
}) {
  const notify = useNotify();
  const client = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const chat = useQuery({
    queryKey: ["support", endpoint],
    queryFn: async () => {
      const res = await fetch(endpoint);
      const data = (await res.json()) as {
        error?: string;
        thread?: SupportThread | null;
        messages?: SupportMessage[];
      };
      if (!res.ok) throw new Error(data.error || "Could not open chat.");
      return data;
    },
    refetchInterval: 12_000,
  });
  const send = useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send.");
      return data;
    },
    onSuccess: () => {
      setDraft("");
      client.invalidateQueries({ queryKey: ["support"] });
      client.invalidateQueries({ queryKey: ["me"] });
      client.invalidateQueries({ queryKey: ["admin-support"] });
      client.invalidateQueries({ queryKey: ["admin-overview"] });
      onSent?.();
    },
    onError: (err: Error) => notify.error("Could not send", err.message),
  });

  const messages = chat.data?.messages || [];

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (chat.isSuccess) {
      client.invalidateQueries({ queryKey: ["me"] });
      client.invalidateQueries({ queryKey: ["admin-support"] });
    }
  }, [chat.isSuccess, client]);

  return (
    <div className="flex min-h-[28rem] flex-col">
      <div className="flex-1 space-y-3">
        {chat.isLoading ? (
          <p className="py-10 text-center text-sm text-muted">Opening chat…</p>
        ) : messages.length === 0 ? (
          <div className="rounded-[1.25rem] border border-line/80 bg-white px-5 py-10 text-center">
            <p className="font-black">{emptyTitle}</p>
            <p className="mt-2 text-sm text-muted">{emptyCopy}</p>
          </div>
        ) : (
          messages.map((item) => {
            const self = item.author === mine;
            return (
              <div key={item.id} className={cn("flex", self ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-[1.15rem] px-4 py-3 text-sm leading-6",
                    self ? "bg-brand text-white" : "border border-line/80 bg-white text-ink",
                  )}
                >
                  <p className="whitespace-pre-wrap">{item.body}</p>
                  <p className={cn("mt-1 text-[11px]", self ? "text-white/70" : "text-muted")}>
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottom} />
      </div>
      <form
        className="mt-5 rounded-[1.25rem] border border-line/80 bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const body = draft.trim();
          if (!body || send.isPending) return;
          send.mutate(body);
        }}
      >
        <Field label={composerLabel}>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write your message"
            maxLength={2000}
            required
          />
        </Field>
        <Button type="submit" className="mt-3 w-full" disabled={send.isPending || draft.trim().length < 2}>
          {send.isPending ? "Sending…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
