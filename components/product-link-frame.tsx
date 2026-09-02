import { formatXAF } from "@/lib/format";
import { normalizeLinkTemplate, type LinkTemplateId } from "@/lib/link-templates";
import { cn } from "@/lib/cn";

export function ProductLinkFrame({
  title,
  amount,
  merchantName,
  imageUrl,
  template,
  compact = false,
  size,
}: {
  title: string;
  amount?: number | null;
  merchantName?: string;
  imageUrl?: string;
  template?: string;
  compact?: boolean;
  size?: "compact" | "default" | "hero";
}) {
  const kind = normalizeLinkTemplate(template);
  const scale = size ?? (compact ? "compact" : "default");
  const name = title.trim() || "Product";
  const shop = merchantName?.trim() || "LBPay";
  const price = amount && amount > 0 ? formatXAF(amount) : "Open amount";
  const hero = scale === "hero";
  const mini = scale === "compact";

  return (
    <div
      className={cn(
        "overflow-hidden text-left shadow-[0_18px_50px_rgba(7,20,15,0.12)]",
        mini ? "rounded-2xl" : hero ? "rounded-[32px]" : "rounded-[28px]",
        frameShell(kind),
      )}
    >
      <FrameChrome kind={kind} shop={shop} compact={mini} />
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          className={cn(
            "w-full object-cover",
            mini ? "h-28" : hero ? "h-[18rem] sm:h-[22rem]" : "h-48 sm:h-56 lg:h-64",
          )}
        />
      ) : (
        <div
          className={cn(
            "grid place-items-center bg-gradient-to-br from-brand-soft to-paper px-4 text-center",
            mini ? "h-28" : hero ? "h-56 sm:h-72" : "h-44 sm:h-52",
          )}
        >
          <span className={cn("font-semibold text-brand-deep", mini ? "text-sm" : hero ? "text-2xl" : "text-xl")}>
            {name}
          </span>
        </div>
      )}
      <div className={cn(mini ? "px-3 py-2.5" : hero ? "px-6 py-5" : "px-5 py-4", lightText(kind) && "text-white")}>
        {!mini ? (
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.14em]",
              lightText(kind) ? "text-white/70" : "text-muted",
            )}
          >
            {shop}
          </p>
        ) : null}
        <p
          className={cn(
            "font-semibold",
            mini ? "truncate text-sm" : hero ? "text-2xl" : "text-lg",
            lightText(kind) ? "text-white" : "text-ink",
          )}
        >
          {name}
        </p>
        <p
          className={cn(
            "font-mono font-bold",
            mini ? "mt-0.5 text-sm" : hero ? "mt-2 text-3xl" : "mt-1 text-2xl",
            lightText(kind) ? "text-white" : "text-brand",
          )}
        >
          {price}
        </p>
        {!mini ? <FrameFooter kind={kind} /> : null}
      </div>
    </div>
  );
}

function lightText(kind: LinkTemplateId) {
  return kind === "voucher" || kind === "display";
}

function frameShell(kind: LinkTemplateId) {
  if (kind === "receipt") return "border border-dashed border-line bg-[#fbfaf6]";
  if (kind === "voucher") return "border border-brand/30 bg-brand text-white";
  if (kind === "display") return "border border-line bg-navy text-white";
  if (kind === "invoice") return "border border-line bg-white";
  return "border border-line bg-white";
}

function FrameChrome({
  kind,
  shop,
  compact,
}: {
  kind: LinkTemplateId;
  shop: string;
  compact: boolean;
}) {
  if (kind === "voucher") {
    return (
      <div className={cn("flex items-center justify-between bg-brand-dark text-white", compact ? "px-3 py-1.5" : "px-5 py-3")}>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Voucher</span>
        <span className="text-[10px] font-semibold">LBPay</span>
      </div>
    );
  }
  if (kind === "display") {
    return (
      <div className={cn("flex items-center justify-between bg-navy text-white/80", compact ? "px-3 py-1.5" : "px-5 py-3")}>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Pay {shop}</span>
        <span className="text-[10px] font-semibold text-brand">LBPay</span>
      </div>
    );
  }
  if (kind === "receipt") {
    return (
      <div className={cn("text-center", compact ? "px-3 pt-2" : "px-5 pt-4")}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Till receipt</p>
        <p className={cn("font-semibold", compact ? "text-sm" : "text-base")}>{shop}</p>
      </div>
    );
  }
  if (kind === "invoice") {
    return (
      <div className={cn("flex items-center justify-between bg-brand text-white", compact ? "px-3 py-1.5" : "px-5 py-3")}>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Invoice</span>
        <span className="text-[10px] font-semibold">LBPay</span>
      </div>
    );
  }
  return (
    <div className={cn("flex items-center justify-between bg-navy text-white", compact ? "px-3 py-1.5" : "px-5 py-3")}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Payment statement</span>
      <span className="text-[10px] font-semibold text-brand">LBPay</span>
    </div>
  );
}

function FrameFooter({ kind }: { kind: LinkTemplateId }) {
  if (kind === "voucher" || kind === "display") {
    return <p className="mt-3 text-xs text-white/70">Tap pay below to complete this.</p>;
  }
  if (kind === "receipt") {
    return (
      <p className="mt-3 border-t border-dashed border-line pt-3 text-center text-xs text-muted">
        *** Pay on LBPay ***
      </p>
    );
  }
  return (
    <p className="mt-3 border-t border-dashed border-line pt-3 text-xs text-muted">
      Amount due on this statement. Pay below.
    </p>
  );
}
