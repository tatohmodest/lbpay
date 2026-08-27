"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { KycPhotoField } from "@/components/kyc-photo-field";
import { useMe } from "@/lib/hooks/wallet";
import { useNotify } from "@/lib/notify";
import type { KycDocuments, KycDocumentType } from "@/lib/kyc";
import type { KycTrack } from "@/lib/types";

export function KycApplyForm({
  track,
  title,
  subtitle,
}: {
  track: KycTrack;
  title: string;
  subtitle: string;
}) {
  const me = useMe();
  const notify = useNotify();
  const client = useQueryClient();
  const [legalName, setLegalName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [documentType, setDocumentType] = useState<KycDocumentType>("national_id");
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [website, setWebsite] = useState("");
  const [docs, setDocs] = useState<Partial<KycDocuments>>({});
  const [loading, setLoading] = useState(false);
  const nameValue = legalName || me.data?.user?.name || "";

  const needsPhotos = track === "personal" || track === "developer";
  const ready =
    Boolean(nameValue.trim() && idNumber.trim()) &&
    (track !== "business" || Boolean(businessName.trim())) &&
    (!needsPhotos || Boolean(docs.idFrontUrl && docs.idBackUrl && docs.selfieUrl));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setLoading(true);
    const res = await fetch("/api/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        track,
        legalName: nameValue,
        idNumber,
        documentType,
        businessName,
        taxId,
        website,
        documents: needsPhotos ? docs : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      notify.error("Could not apply", data.error || "Try again");
      return;
    }
    notify.success(
      "Application sent",
      track === "developer"
        ? "Sandbox is unlocking now. Live keys wait until we review your account."
        : "We'll review your account shortly.",
    );
    await client.invalidateQueries({ queryKey: ["me"] });
    await client.invalidateQueries({ queryKey: ["kyc"] });
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
      <form className="mt-5 flex flex-col gap-4" onSubmit={submit}>
        <Field label="Legal name">
          <Input value={nameValue} onChange={(e) => setLegalName(e.target.value)} required />
        </Field>
        <Field label="National ID / passport number">
          <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required />
        </Field>
        {needsPhotos ? (
          <>
            <Field label="Document type">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "national_id" as const, label: "National ID" },
                    { id: "passport" as const, label: "Passport" },
                  ]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDocumentType(item.id)}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                      documentType === item.id ? "border-brand bg-brand-soft text-brand-dark" : "border-line"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </Field>
            <p className="text-sm text-muted">Clear photos, 10MB max.</p>
            <KycPhotoField
              kind="idFront"
              url={docs.idFrontUrl}
              hint="Front of your ID. 10MB max."
              onUploaded={(result) =>
                setDocs((prev) => ({ ...prev, idFrontUrl: result.url, idFrontId: result.publicId }))
              }
            />
            <KycPhotoField
              kind="idBack"
              url={docs.idBackUrl}
              hint="Back of your ID. 10MB max."
              onUploaded={(result) =>
                setDocs((prev) => ({ ...prev, idBackUrl: result.url, idBackId: result.publicId }))
              }
            />
            <KycPhotoField
              kind="selfie"
              url={docs.selfieUrl}
              hint="A photo of you with your ID. 10MB max."
              onUploaded={(result) =>
                setDocs((prev) => ({ ...prev, selfieUrl: result.url, selfieId: result.publicId }))
              }
            />
          </>
        ) : null}
        {track === "business" ? (
          <>
            <Field label="Business name">
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
            </Field>
            <Field label="Tax ID">
              <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} />
            </Field>
          </>
        ) : null}
        {track === "developer" ? (
          <Field label="Website / app">
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
          </Field>
        ) : null}
        <Button type="submit" disabled={loading || !ready}>
          {loading ? "Sending…" : "Submit verification"}
        </Button>
      </form>
    </Card>
  );
}
