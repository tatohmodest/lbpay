"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { compressAvatarImage } from "@/lib/image-compress";
import { MAX_KYC_UPLOAD_BYTES } from "@/lib/kyc";
import { useNotify } from "@/lib/notify";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import type { UserProfile } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";

export function ProfileAvatar({ src, name }: { src: string; name: string }) {
  const notify = useNotify();
  const { hydrateFromServer, state } = useApp();
  const me = useMe();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(src);

  useEffect(() => {
    setPreview(src);
  }, [src]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_KYC_UPLOAD_BYTES) {
      notify.error("Too large", "Maximum upload is 10MB.");
      return;
    }
    setBusy(true);
    try {
      const compressed = await compressAvatarImage(file);
      const body = new FormData();
      body.set("file", compressed);
      const res = await fetch("/api/me/avatar", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
        user?: UserProfile;
      };
      if (!res.ok || !data.url || !data.user) throw new Error(data.error || "Could not update that photo.");
      setPreview(data.url);
      hydrateFromServer({
        user: data.user,
        balance: me.data?.balance ?? state.balance,
        transactions: state.transactions,
      });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      notify.info("Photo updated", "Your new profile picture is live.");
    } catch (err) {
      notify.error("Upload failed", err instanceof Error ? err.message : "Try another photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="relative mx-auto block h-24 w-24 cursor-pointer">
      <Image
        src={preview || src}
        alt={name || "Profile photo"}
        width={96}
        height={96}
        className="h-24 w-24 rounded-full object-cover"
      />
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-center rounded-b-full bg-ink/70 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
        {busy ? "Saving…" : (
          <span className="inline-flex items-center gap-1">
            <Camera className="h-3 w-3" /> Change
          </span>
        )}
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="sr-only"
        disabled={busy}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
    </label>
  );
}
