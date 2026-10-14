import type { Metadata } from "next";

export const SITE_NAME = "LBPay";
export const SITE_TAGLINE = "Financial infrastructure for Cameroon";

const FALLBACK_SITE_URL = "https://lbpay.loopingbinary.com";

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
      "Opening an account is free and LBPay to LBPay transfers are always free. Adding money costs 1.53%, sending to an MTN or Orange number costs 2.5%, and a direct MTN to Orange transfer costs 3.5%. The fee is added on top, so the person you pay receives the full amount, and you see the total before you enter your PIN.",
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

export const SITE_FAQS_FR = [
  {
    question: "Qu'est-ce que LBPay ?",
    answer:
      "LBPay est une application de paiement conçue au Cameroun. Vous obtenez un portefeuille XAF avec votre propre @identifiant pour envoyer, recevoir et épargner. Les commerçants encaissent avec des liens boutique et des QR codes, et les développeurs utilisent l'API de paiement. MTN Mobile Money et Orange Money fonctionnent en arrière-plan : vous pouvez payer et être payé par tout le monde.",
  },
  {
    question: "Combien coûte LBPay ?",
    answer:
      "L'ouverture de compte est gratuite et les transferts LBPay vers LBPay sont toujours gratuits. Ajouter de l'argent coûte 1,53 %, envoyer vers un numéro MTN ou Orange coûte 2,5 %, et un transfert direct MTN vers Orange coûte 3,5 %. Les frais s'ajoutent au montant : la personne que vous payez reçoit tout, et vous voyez le total avant de saisir votre PIN.",
  },
  {
    question: "Mon argent est-il en sécurité avec LBPay ?",
    answer:
      "Chaque paiement exige votre PIN à 4 chiffres, et quatre erreurs le bloquent. Les mots de passe et PIN sont stockés sous forme de hachages scrypt salés, jamais en clair. Chaque mouvement est enregistré avec sa propre référence, les sessions web se verrouillent après 15 minutes d'inactivité, et les envois sont plafonnés à 500 000 XAF par jour jusqu'à la vérification de votre identité.",
  },
  {
    question: "Que se passe-t-il si un transfert vers Mobile Money échoue ?",
    answer:
      "Si MTN ou Orange refuse le paiement, LBPay vous rembourse automatiquement le montant et les frais dans votre portefeuille. Cela se fait une seule fois par transfert, et les deux opérations apparaissent dans votre historique.",
  },
  {
    question: "Puis-je envoyer de l'argent de MTN vers Orange avec LBPay ?",
    answer:
      "Oui. Envoyez à un numéro de téléphone ou à un @identifiant. Si la personne est sur LBPay, l'argent arrive instantanément et gratuitement. S'il doit aller vers MTN ou Orange, LBPay effectue le paiement sur ce réseau pour vous.",
  },
  {
    question: "Comment les commerçants sont-ils payés avec LBPay ?",
    answer:
      "Les commerçants partagent une page boutique, un lien produit ou un QR code au comptoir. Les clients paient par MTN Mobile Money, Orange Money ou leur portefeuille LBPay, et chaque paiement arrive sur un seul solde avec sa propre trace.",
  },
  {
    question: "LBPay propose-t-il une API de paiement et une sandbox ?",
    answer:
      "Oui. Demandez l'accès développeur depuis votre profil et recevez immédiatement des clés sandbox. Les clés de production se débloquent après vérification. L'API couvre les paiements, les décaissements, les liens de paiement et le solde.",
  },
  {
    question: "LBPay est-il une banque ?",
    answer:
      "Non. LBPay est un produit de paiement créé par Looping Binary au Cameroun. Les paiements Mobile Money passent par les réseaux MTN Mobile Money et Orange Money via notre partenaire de traitement des paiements.",
  },
  {
    question: "Comment joindre une vraie personne ?",
    answer:
      "Ouvrez Support dans l'app pour discuter avec l'équipe, ou écrivez à loopingbinary@gmail.com. Les messages arrivent directement à l'équipe LBPay.",
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

/** Placeholder in docs snippets. Swapped for the domain the reader is actually on. */
export const DOCS_ORIGIN = "https://lbpay.loopingbinary.com";
