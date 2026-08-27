"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { compressKycImage } from "@/lib/image-compress";
import { kycKindLabel, MAX_KYC_UPLOAD_BYTES, type KycImageKind } from "@/lib/kyc";
import { cn } from "@/lib/cn";

export function KycPhotoField({
  kind,
  url,
  onUploaded,
  hint,
}: {
  kind: KycImageKind;
  url?: string;
  onUploaded: (result: { url: string; publicId?: string }) => void;
  hint: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (file.size > MAX_KYC_UPLOAD_BYTES) {
      setError("Maximum upload is 10MB.");
      return;
    }
    setBusy(true);
    try {
      const compressed = await compressKycImage(file);
      const body = new FormData();
      body.set("kind", kind);
      body.set("file", compressed);
      const res = await fetch("/api/kyc/upload", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
        publicId?: string;
      };
      if (!res.ok || !data.url) throw new Error(data.error || "Could not upload that photo.");
      onUploaded({ url: data.url, publicId: data.publicId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload that photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{kycKindLabel(kind)}</span>
      <span
        className={cn(
          "flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed p-3 text-center",
          url ? "border-brand bg-brand-soft/40" : "border-line bg-paper",
          busy && "opacity-70",
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-40 w-full rounded-xl object-cover" />
        ) : (
          <>
            <Camera className="h-6 w-6 text-brand" />
            <span className="mt-2 text-sm font-semibold">{busy ? "Compressing and uploading…" : "Tap to add photo"}</span>
            <span className="mt-1 text-xs text-muted">{hint}</span>
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
      {url && !busy ? <span className="mt-1 block text-xs text-brand">Uploaded. Tap to replace.</span> : null}
      {error ? <span className="mt-1 block text-xs font-semibold text-danger">{error}</span> : null}
    </label>
  );
}
