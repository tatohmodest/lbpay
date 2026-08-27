import type { Metadata } from "next";

export const SITE_NAME = "LBPay";
export const SITE_TAGLINE = "Financial infrastructure for Cameroon";

const FALLBACK_SITE_URL = "https://lbpay.cm";

function normalizeSiteUrl(raw: string | undefined): string {
  let value = (raw || "").trim().replace(/^['"]|['"]$/g, "");
  if (!value) return FALLBACK_SITE_URL;

  value = value.replace(/^(https?);\/\//i, "$1://");
  value = value.replace(/^(https?):;\/\//i, "$1://");
  value = value.replace(/^(https?):\/(?!\/)/i, "$1://");
  value = value.replace(/^(https?)\/\//i, "$1://");
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value.replace(/^\/+/, "")}`;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return FALLBACK_SITE_URL;
    if (!url.hostname.includes(".")) return FALLBACK_SITE_URL;
    return url.origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const SITE_ORIGIN = new URL(SITE_URL);

function repairUrlProtocol(raw: string) {
  let value = raw.trim().replace(/^['"]|['"]$/g, "");
  value = value.replace(/^(https?);\/\//i, "$1://");
  value = value.replace(/^(https?):;\/\//i, "$1://");
  value = value.replace(/^(https?):\/(?!\/)/i, "$1://");
  value = value.replace(/^(https?)\/\//i, "$1://");
  if (!/^https?:\/\//i.test(value)) {
    value = value.startsWith("/") ? `${SITE_URL}${value}` : `https://${value.replace(/^\/+/, "")}`;
  }
  return value;
}

export function httpsCallbackUrl(raw: string | undefined, fallbackPath: string) {
  const fallback = `${SITE_URL}${fallbackPath.startsWith("/") ? fallbackPath : `/${fallbackPath}`}`;
  const value = repairUrlProtocol(raw || "");
  if (!value) return fallback;
  try {
    const url = new URL(value);
    if (!url.hostname.includes(".")) return fallback;
    url.protocol = "https:";
    return url.toString().replace(/\/$/, url.pathname === "/" ? "" : "");
  } catch {
    return fallback;
  }
}

export function payunitGatewayUrl(raw: string | undefined) {
  const value = repairUrlProtocol(raw || "https://gateway.payunit.net");
  try {
    const url = new URL(value);
    if (!url.hostname.endsWith("payunit.net")) return "https://gateway.payunit.net";
    return url.origin;
  } catch {
    return "https://gateway.payunit.net";
  }
}

export const SITE_TITLE = "LBPay | Send money in Cameroon, MTN, Orange Money, XAF wallet";

export const SITE_DESCRIPTION =
  "LBPay is Cameroon's payment and wallet platform. Send and receive XAF, transfer between MTN Mobile Money and Orange Money, collect with QR and payment links, and integrate a sandbox-to-live payments API.";

export const SITE_KEYWORDS = [
  "LBPay",
  "Cameroon payment",
  "Cameroon wallet",
  "send money Cameroon",
  "MTN Mobile Money",
  "Orange Money",
  "MTN to Orange",
  "XAF wallet",
  "Mobile Money API",
  "payment gateway Cameroon",
  "QR payment Cameroon",
  "payment links",
  "fintech Cameroon",
  "digital wallet XAF",
  "disbursement API",
  "merchant checkout Cameroon",
];

export const SITE_FAQS = [
  {
    question: "What is LBPay?",
    answer:
      "LBPay is a Cameroon payment and wallet platform. People send and receive XAF, businesses collect with QR and payment links, and developers call a payments API. MTN Mobile Money, Orange Money, cards, and the LBPay wallet are rails underneath the product.",
  },
  {
    question: "Can I send money from MTN to Orange with LBPay?",
    answer:
      "Yes. You send to a phone number or an @handle. If the money stays on LBPay it is an internal wallet transfer. If it must leave to MTN or Orange, LBPay runs a disbursement on the payment rail.",
  },
  {
    question: "Does LBPay support a payments API and sandbox?",
    answer:
      "Developers apply for API access and receive sandbox keys immediately. Live keys are issued after KYC approval. The API covers payments, payouts, payment links, webhooks, and balance.",
  },
  {
    question: "How do merchants collect payments in Cameroon?",
    answer:
      "Businesses use one checkout for MTN Mobile Money, Orange Money, cards, and LBPay wallet. Customers can pay by QR code or a payment link. The merchant does not integrate each network separately.",
  },
] as const;

export const NOINDEX: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};
