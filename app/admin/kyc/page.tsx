"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Check, ImageOff, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminHeader, AdminPanel } from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { useNotify } from "@/lib/notify";
import { businessKindLabel } from "@/lib/kyc";
import { mediaSrc } from "@/lib/media";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

type KycApp = {
  id: string;
  track: string;
  status: "pending" | "approved" | "rejected";
  legalName: string;
  idNumber: string;
  businessName?: string;
  businessKind?: string;
  taxId?: string;
  note?: string;
  reviewNote?: string;
  documentType?: string;
  website?: string;
  createdAt: string;
  reviewedAt?: string;
  documents?: {
    idFrontUrl?: string;
    idBackUrl?: string;
    selfieUrl?: string;
  };
  user?: { name: string; lbpayId: string; email: string; kyc?: Record<string, string> };
};

const REASONS = [
  "Photo is blurry or cut off",
  "Name doesn't match the account",
  "ID is expired",
  "Selfie doesn't show the same ID",
  "Not a valid ID document",
];

type Tab = "pending" | "approved" | "rejected" | "all";

export default function AdminKycPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const [tab, setTab] = useState<Tab>("pending");
  const [viewer, setViewer] = useState<{ src: string; label: string } | null>(null);
  const apps = useQuery({
    queryKey: ["admin-kyc"],
    queryFn: async () => {
      const res = await fetch("/api/admin/kyc");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load KYC.");
      return data as { applications: KycApp[] };
    },
  });
  const mutate = useMutation({
    mutationFn: (body: { id: string; decision: "approve" | "reject"; note: string }) =>
      fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed");
        return data;
      }),
    onSuccess: (_d, vars) => {
      client.invalidateQueries({ queryKey: ["admin-kyc"] });
      client.invalidateQueries({ queryKey: ["admin-overview"] });
      notify.success(
        vars.decision === "approve" ? "Approved" : "Rejected",
        vars.decision === "approve" ? "Their access is on." : "They've been told what to fix.",
      );
    },
    onError: (err: Error) => notify.error("Not saved", err.message),
  });

  const counts = useMemo(() => {
    const all = apps.data?.applications || [];
    return {
      pending: all.filter((a) => a.status === "pending").length,
      approved: all.filter((a) => a.status === "approved").length,
      rejected: all.filter((a) => a.status === "rejected").length,
      all: all.length,
    };
  }, [apps.data]);
  const all = apps.data?.applications || [];
  const rows = tab === "all" ? all : all.filter((a) => a.status === tab);

  return (
    <div className="space-y-4">
      <AdminHeader
        title="KYC review"
        copy="Open each photo, check the name and number match, then approve or say what to fix."
      />

      <div className="flex flex-wrap gap-1.5">
        {(["pending", "approved", "rejected", "all"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] font-bold capitalize transition",
              tab === key ? "bg-ink text-white" : "bg-white text-muted ring-1 ring-line hover:text-ink",
            )}
          >
            {key} <span className="tabular opacity-70">{counts[key]}</span>
          </button>
        ))}
      </div>

      {apps.isError ? (
        <AdminPanel>
          <p className="px-4 py-8 text-center text-sm text-danger">{(apps.error as Error).message}</p>
        </AdminPanel>
      ) : apps.isLoading ? (
        <AdminPanel>
          <p className="px-4 py-8 text-center text-sm text-muted">Loading…</p>
        </AdminPanel>
      ) : rows.length === 0 ? (
        <AdminPanel>
          <p className="px-4 py-10 text-center text-sm text-muted">
            {tab === "pending" ? "Nothing waiting. You're all caught up." : "None"}
          </p>
        </AdminPanel>
      ) : (
        <div className="space-y-3">
          {rows.map((app) => (
            <KycCard
              key={app.id}
              app={app}
              busy={mutate.isPending && mutate.variables?.id === app.id}
              onOpen={setViewer}
              onDecide={(decision, note) => mutate.mutate({ id: app.id, decision, note })}
            />
          ))}
        </div>
      )}

      {viewer ? <PhotoViewer {...viewer} onClose={() => setViewer(null)} /> : null}
    </div>
  );
}

function KycCard({
  app,
  busy,
  onOpen,
  onDecide,
}: {
  app: KycApp;
  busy: boolean;
  onOpen: (v: { src: string; label: string }) => void;
  onDecide: (decision: "approve" | "reject", note: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const trackVerified = app.user?.kyc?.[app.track] === "verified";
  // An approved application whose access went missing can be repaired.
  const needsRestore = app.status === "approved" && app.user?.kyc && !trackVerified;

  return (
    <AdminPanel>
      <div className="px-3 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={app.status} />
              <span className="rounded-full bg-paper px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">
                {app.track}
                {app.track === "business" && app.businessKind
                  ? ` · ${businessKindLabel(app.businessKind)}`
                  : app.documentType
                    ? ` · ${app.documentType.replace("_", " ")}`
                    : ""}
              </span>
            </div>
            <p className="mt-2 text-lg font-black">{app.user?.name || "Unknown user"}</p>
            <p className="text-xs text-muted">
              @{app.user?.lbpayId} · {app.user?.email}
            </p>
          </div>
          <p className="text-right text-xs text-muted">
            Sent {formatDate(app.createdAt)}
            {app.reviewedAt ? (
              <>
                <br />
                Reviewed {formatDate(app.reviewedAt)}
              </>
            ) : null}
          </p>
        </div>

        <dl className="mt-3 grid gap-x-6 gap-y-1.5 rounded-2xl bg-paper p-3 text-sm sm:grid-cols-2">
          <Detail label="Legal name" value={app.legalName} />
          {app.idNumber ? <Detail label="ID number" value={app.idNumber} mono /> : null}
          {app.businessName ? <Detail label="Business" value={app.businessName} /> : null}
          {app.taxId ? <Detail label="Tax ID" value={app.taxId} mono /> : null}
          {app.website ? <Detail label="Website" value={app.website} /> : null}
          {app.note ? <Detail label="Their note" value={app.note} /> : null}
        </dl>

        {app.documents ? (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            <DocThumb url={app.documents.idFrontUrl} label="Front" onOpen={onOpen} />
            <DocThumb url={app.documents.idBackUrl} label="Back" onOpen={onOpen} />
            <DocThumb url={app.documents.selfieUrl} label="Holding ID" onOpen={onOpen} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">
            {app.track === "business"
              ? "Business checks use the personal ID already approved for this person."
              : "No identity photos on this application."}
          </p>
        )}

        {app.status === "rejected" && app.reviewNote ? (
          <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">Reason: {app.reviewNote}</p>
        ) : null}

        {app.status === "pending" ? (
          rejecting ? (
            <div className="mt-4 space-y-2 rounded-2xl border border-line p-3">
              <p className="text-sm font-bold">What should they fix?</p>
              <div className="flex flex-wrap gap-1.5">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={cn(
                      "rounded-full px-3 py-1 text-[12px] font-semibold transition",
                      reason === r ? "bg-ink text-white" : "bg-paper text-ink ring-1 ring-line",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Or write the reason" />
              <div className="flex gap-2">
                <Button variant="dark" className="bg-danger hover:bg-danger/90" disabled={busy || !reason.trim()} onClick={() => onDecide("reject", reason.trim())}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Send rejection
                </Button>
                <Button variant="ghost" disabled={busy} onClick={() => setRejecting(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex gap-2">
              <Button disabled={busy} onClick={() => onDecide("approve", "")}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => setRejecting(true)}>
                Reject
              </Button>
            </div>
          )
        ) : needsRestore ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-gold-soft p-3 text-sm">
            <span className="flex-1">Approved, but their {app.track} access is off.</span>
            <Button size="sm" disabled={busy} onClick={() => onDecide("approve", "")}>
              Turn access back on
            </Button>
          </div>
        ) : null}
      </div>
    </AdminPanel>
  );
}

function StatusPill({ status }: { status: KycApp["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        status === "pending" && "bg-gold-soft text-ink",
        status === "approved" && "bg-brand-soft text-brand-deep",
        status === "rejected" && "bg-danger/10 text-danger",
      )}
    >
      {status}
    </span>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 sm:block">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={cn("break-words font-semibold", mono && "font-mono")}>{value}</dd>
    </div>
  );
}

function DocThumb({
  url,
  label,
  onOpen,
}: {
  url?: string;
  label: string;
  onOpen: (v: { src: string; label: string }) => void;
}) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const src = url ? `${mediaSrc(url)}${attempt ? `${String(mediaSrc(url)).includes("?") ? "&" : "?"}r=${attempt}` : ""}` : "";

  if (!url) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-xl bg-paper p-3 text-center text-xs text-muted">
        {label}: not sent
      </div>
    );
  }
  return (
    <div>
      <button
        type="button"
        onClick={() => state === "ok" && onOpen({ src, label })}
        className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-paper ring-1 ring-line"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={src}
          src={src}
          alt={label}
          onLoad={() => setState("ok")}
          onError={() => setState("error")}
          className={cn("h-full w-full object-cover transition-opacity", state === "ok" ? "opacity-100" : "opacity-0")}
        />
        {state === "loading" ? (
          <span className="absolute inset-0 grid place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted" />
          </span>
        ) : null}
        {state === "error" ? (
          <span className="absolute inset-0 grid place-items-center p-2 text-center text-[11px] text-muted">
            <span>
              <ImageOff className="mx-auto mb-1 h-5 w-5" />
              Couldn&apos;t load
            </span>
          </span>
        ) : null}
      </button>
      <div className="mt-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted">
        <span>{label}</span>
        {state === "error" ? (
          <button
            type="button"
            className="font-bold text-brand-deep"
            onClick={() => {
              setState("loading");
              setAttempt((n) => n + 1);
            }}
          >
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PhotoViewer({ src, label, onClose }: { src: string; label: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
      className="fixed inset-0 z-[120] grid place-items-center bg-black/85 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"
      >
        <X className="h-5 w-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] max-w-full rounded-xl object-contain"
      />
      <p className="absolute bottom-4 left-0 right-0 text-center text-sm font-semibold text-white/80">{label}</p>
    </div>
  );
}
