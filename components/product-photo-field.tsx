"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { compressProductImage, MAX_IMAGE_UPLOAD_BYTES } from "@/lib/image-compress";
import { cn } from "@/lib/cn";

function isHeic(file: File) {
  return /heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

export function ProductPhotoField({
  url,
  onUploaded,
}: {
  url?: string;
  onUploaded: (url: string, publicId?: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (isHeic(file)) {
      setError("Use a JPG, PNG, or WEBP photo.");
      return;
    }
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
      const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string; publicId?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Could not upload that photo.");
      onUploaded(data.url, data.publicId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload that photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        Product photo
      </span>
      <span
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void onFile(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative flex cursor-pointer overflow-hidden rounded-[1.5rem] ring-1 transition",
          url ? "ring-brand/40" : "ring-line/80",
          dragging && "ring-2 ring-brand",
          busy && "opacity-70",
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="aspect-[5/4] w-full object-cover" />
        ) : (
          <span className="flex aspect-[5/4] w-full flex-col items-center justify-center gap-2 bg-paper px-6 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
              <Camera className="h-5 w-5" />
            </span>
            <span className="text-sm font-bold text-ink">
              {busy ? "Compressing and uploading…" : dragging ? "Drop the photo" : "Add a product photo"}
            </span>
            <span className="text-xs text-muted">JPG, PNG, or WEBP. Up to 10MB.</span>
          </span>
        )}
        {url ? (
          <span className="absolute inset-x-3 bottom-3 inline-flex h-10 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-ink shadow-[0_8px_20px_rgba(12,25,19,0.12)]">
            {busy ? "Uploading…" : "Change photo"}
          </span>
        ) : null}
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="sr-only"
        disabled={busy}
        onChange={(event) => {
          void onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {error ? <span className="mt-1.5 block text-xs font-semibold text-danger">{error}</span> : null}
    </label>
  );
}
