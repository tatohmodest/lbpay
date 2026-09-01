"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNotify } from "@/lib/notify";
import { cn } from "@/lib/cn";

type SavedReview = { id: string; rating: number; body: string };

export function ReviewForm() {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const mine = useQuery({
    queryKey: ["my-review"],
    queryFn: async () => {
      const res = await fetch("/api/reviews/me");
      const data = (await res.json()) as { review?: SavedReview | null; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not load your review.");
      return data.review || null;
    },
  });
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!mine.data) return;
    setRating(mine.data.rating);
    setBody(mine.data.body);
  }, [mine.data]);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, body }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not save that review.");
      await queryClient.invalidateQueries({ queryKey: ["my-review"] });
      notify.info("Review saved", "Thank you. It can appear on the homepage once more people review.");
    } catch (err) {
      notify.error("Could not save", err instanceof Error ? err.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-4 p-5 text-left">
      <h2 className="text-lg font-black">Leave a review</h2>
      <p className="mt-1 text-sm text-muted">Tell others how LBPay feels to use. You can change it anytime.</p>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} star${value === 1 ? "" : "s"}`}
            onClick={() => setRating(value)}
            className="p-0.5"
          >
            <Star className={cn("h-7 w-7", value <= rating ? "fill-brand text-brand" : "text-line")} />
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={320}
        placeholder="What should someone know before they open a wallet?"
        className="mt-3 w-full rounded-2xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-brand"
      />
      <Button className="mt-3" disabled={busy || rating < 1 || body.trim().length < 12} onClick={() => void save()}>
        {mine.data ? "Update review" : "Publish review"}
      </Button>
    </Card>
  );
}
