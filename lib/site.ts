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
    // Merchant dashboard host is not the API. Collections and disbursements live on gateway.
    if (url.hostname === "app.payunit.net" || url.hostname === "pu.payunit.net") {
      return "https://gateway.payunit.net";
    }
    return url.origin;
  } catch {
    return "https://gateway.payunit.net";
  }
}

export const SITE_OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "LBPay. Send money in Cameroon.",
  type: "image/png",
} as const;

export const SITE_TITLE = "LBPay | Send money in Cameroon";

export const SITE_DESCRIPTION =
  "Send and receive XAF in Cameroon. Transfer between MTN Mobile Money and Orange Money, collect with QR and payment links, and use a payments API.";

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
      "LBPay is a payments app built in Cameroon. You get an XAF wallet with your own @handle to send, receive and save money. Businesses collect with shop links and QR codes, and developers use the payments API. MTN Mobile Money and Orange Money work underneath, so you can pay and get paid by anyone.",
  },
  {
    question: "How much does LBPay cost?",
    answer:
      "Opening an account is free and LBPay to LBPay transfers are always free. Adding money costs 1.5%, sending to an MTN or Orange number costs 2.5%, and a direct MTN to Orange transfer costs 3.5%. The fee is added on top, so the person you pay receives the full amount, and you see the total before you enter your PIN.",
  },
  {
    question: "Is my money safe with LBPay?",
    answer:
      "Every payment needs your 4-digit PIN, and four wrong tries lock it. Passwords and PINs are stored as salted scrypt hashes, never in plain text. Every movement is posted to a ledger with its own reference, web sessions lock after 15 minutes of inactivity, and outgoing transfers are capped at 500,000 XAF a day until your ID is verified.",
  },
  {
    question: "What happens if a transfer to Mobile Money fails?",
    answer:
      "If MTN or Orange rejects the payout, LBPay returns the full amount and the fee to your wallet automatically. It happens once per transfer, and both entries show in your history so you can see exactly what happened.",
  },
  {
    question: "Can I send money from MTN to Orange with LBPay?",
    answer:
      "Yes. Send to a phone number or an @handle. If the person is on LBPay the money arrives instantly and free. If it has to go to MTN or Orange, LBPay pays it out on that network for you.",
  },
  {
    question: "How do businesses get paid with LBPay?",
    answer:
      "Merchants share a shop page, a single product link, or a QR code at the counter. Customers pay with MTN Mobile Money, Orange Money, or their LBPay wallet, and every payment lands in one balance with its own record.",
  },
  {
    question: "Does LBPay have a payments API and sandbox?",
    answer:
      "Yes. Apply for developer access from your profile and you get sandbox keys right away. Live keys unlock after verification. The API covers payments, payouts, payment links and balance.",
  },
  {
    question: "Is LBPay a bank?",
    answer:
      "No. LBPay is a payments product made by Looping Binary in Cameroon. Mobile Money payments run on the MTN Mobile Money and Orange Money networks through our payment processing partner.",
  },
  {
    question: "How do I reach a real person?",
    answer:
      "Open Support in the app to chat with the team, or email loopingbinary@gmail.com. Messages go straight to the LBPay team.",
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
