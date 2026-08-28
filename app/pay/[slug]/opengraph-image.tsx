import { ImageResponse } from "next/og";
import { formatXAF } from "@/lib/format";
import { normalizeLinkTemplate, type LinkTemplateId } from "@/lib/link-templates";
import { findLinkBySlug, findUserById } from "@/lib/server/db";

export const alt = "LBPay payment";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

async function loadPhoto(url?: string) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const mime = res.headers.get("content-type") || "image/jpeg";
    return `data:${mime};base64,${Buffer.from(buffer).toString("base64")}`;
  } catch {
    return null;
  }
}

function theme(kind: LinkTemplateId) {
  if (kind === "voucher") {
    return { bg: "#00b369", panel: "#009657", ink: "#ffffff", muted: "rgba(255,255,255,0.78)", accent: "#ffffff", label: "VOUCHER" };
  }
  if (kind === "display") {
    return { bg: "#07140f", panel: "#0c1913", ink: "#ffffff", muted: "rgba(255,255,255,0.7)", accent: "#00b369", label: "PAY" };
  }
  if (kind === "receipt") {
    return { bg: "#f6faf8", panel: "#fbfaf6", ink: "#0c1913", muted: "#5a6b63", accent: "#00b369", label: "TILL RECEIPT" };
  }
  if (kind === "invoice") {
    return { bg: "#e7f7ef", panel: "#ffffff", ink: "#0c1913", muted: "#5a6b63", accent: "#00b369", label: "INVOICE" };
  }
  return { bg: "#07140f", panel: "#ffffff", ink: "#0c1913", muted: "#5a6b63", accent: "#00b369", label: "PAYMENT STATEMENT" };
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const link = await findLinkBySlug(slug);
  const owner = link ? await findUserById(link.userId) : null;
  const kind = normalizeLinkTemplate(link?.template);
  const colors = theme(kind);
  const title = link?.title || "Payment";
  const merchant = owner?.businessName || owner?.name || "LBPay";
  const amount = link?.amount ? formatXAF(link.amount) : "Open amount";
  const photo = await loadPhoto(link?.imageUrl);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background: colors.bg,
          padding: "42px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            overflow: "hidden",
            borderRadius: "36px",
            background: colors.panel,
            boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
          }}
        >
          <div
            style={{
              width: photo ? "520px" : "0px",
              height: "100%",
              display: "flex",
              background: "#0c1913",
            }}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" width={520} height={546} style={{ objectFit: "cover" }} />
            ) : null}
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "48px 52px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div
                style={{
                  display: "flex",
                  color: colors.muted,
                  fontSize: 22,
                  letterSpacing: "0.16em",
                  fontWeight: 700,
                }}
              >
                {colors.label}
              </div>
              <div style={{ display: "flex", color: colors.accent, fontSize: 28, fontWeight: 800 }}>LBPay</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", color: colors.muted, fontSize: 24, marginBottom: 12 }}>{merchant}</div>
              <div
                style={{
                  display: "flex",
                  color: colors.ink,
                  fontSize: title.length > 28 ? 48 : 58,
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                {title}
              </div>
              <div
                style={{
                  display: "flex",
                  color: colors.accent,
                  fontSize: 44,
                  fontWeight: 800,
                  marginTop: 18,
                }}
              >
                {amount}
              </div>
            </div>
            <div style={{ display: "flex", color: colors.muted, fontSize: 22 }}>Pay this on LBPay</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
