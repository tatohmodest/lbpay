"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { compressProductImage, MAX_IMAGE_UPLOAD_BYTES } from "@/lib/image-compress";
import { cn } from "@/lib/cn";

export function ProductPhotoField({
  url,
  onUploaded,
}: {
  url?: string;
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setError("Maximum upload is 10MB.");
      return;
    }
    setBusy(true);
    try {
      const compressed = await compressProductImage(file);
      const body = new FormData();
      body.set("file", compressed);
      const res = await fetch("/api/links/upload", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Could not upload that photo.");
      onUploaded(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload that photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">Product photo</span>
      <span
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed p-3 text-center",
          url ? "border-brand bg-brand-soft/40" : "border-line bg-paper",
          busy && "opacity-70",
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-36 w-full rounded-xl object-cover" />
        ) : (
          <>
            <Camera className="h-6 w-6 text-brand" />
            <span className="mt-2 text-sm font-semibold">
              {busy ? "Compressing and uploading…" : "Add a photo"}
            </span>
            <span className="mt-1 text-xs text-muted">Optional. Up to 10MB, then we shrink it.</span>
          </>
        )}
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="sr-only"
        disabled={busy}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {error ? <span className="mt-1 block text-xs font-semibold text-danger">{error}</span> : null}
    </label>
  );
}
