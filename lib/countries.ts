/**
 * Cross-border corridors: CEMAC (XAF zone) plus the West African markets LBPay
 * delivers to. Rates are indicative mid-market references, refreshed with each
 * release; the quote shown to the user is locked when they confirm.
 */

export type CorridorCurrency = "XAF" | "XOF" | "NGN" | "GHS";

export type PayoutRail = {
  id: string;
  label: string;
  /** What the recipient field asks for. */
  field: "phone" | "account";
  hint: string;
};

export type Country = {
  code: string;
  name: string;
  /** Short label for tight grids (defaults to name). */
  short?: string;
  flag: string;
  currency: CorridorCurrency;
  dial: string;
  region: "CEMAC" | "West Africa";
  /** Indicative units of local currency per 1 XAF. */
  rate: number;
  rails: PayoutRail[];
  /** Typical delivery time shown in the UI. */
  eta: string;
};

const momo = (label: string, hint: string): PayoutRail => ({ id: label.toLowerCase().replace(/\s+/g, "-"), label, field: "phone", hint });
const bank = (hint = "Account number"): PayoutRail => ({ id: "bank", label: "Bank account", field: "account", hint });

export const COUNTRIES: Country[] = [
  {
    code: "CM",
    name: "Cameroon",
    flag: "🇨🇲",
    currency: "XAF",
    dial: "+237",
    region: "CEMAC",
    rate: 1,
    eta: "Instant",
    rails: [momo("MTN MoMo", "MTN number, e.g. 6 7x xx xx xx"), momo("Orange Money", "Orange number, e.g. 6 9x xx xx xx")],
  },
  {
    code: "GA",
    name: "Gabon",
    flag: "🇬🇦",
    currency: "XAF",
    dial: "+241",
    region: "CEMAC",
    rate: 1,
    eta: "Minutes",
    rails: [momo("Airtel Money", "Airtel number"), momo("Moov Money", "Moov number"), bank()],
  },
  {
    code: "TD",
    name: "Chad",
    flag: "🇹🇩",
    currency: "XAF",
    dial: "+235",
    region: "CEMAC",
    rate: 1,
    eta: "Minutes",
    rails: [momo("Airtel Money", "Airtel number"), momo("Moov Money", "Moov number"), bank()],
  },
  {
    code: "CG",
    name: "Congo (Brazzaville)",
    flag: "🇨🇬",
    currency: "XAF",
    dial: "+242",
    region: "CEMAC",
    rate: 1,
    eta: "Minutes",
    rails: [momo("MTN MoMo", "MTN number"), momo("Airtel Money", "Airtel number"), bank()],
  },
  {
    code: "CF",
    name: "Central African Republic",
    short: "CAR",
    flag: "🇨🇫",
    currency: "XAF",
    dial: "+236",
    region: "CEMAC",
    rate: 1,
    eta: "Minutes",
    rails: [momo("Orange Money", "Orange number"), momo("Telecel Money", "Telecel number"), bank()],
  },
  {
    code: "GQ",
    name: "Equatorial Guinea",
    short: "Eq. Guinea",
    flag: "🇬🇶",
    currency: "XAF",
    dial: "+240",
    region: "CEMAC",
    rate: 1,
    eta: "Same day",
    rails: [momo("Muni Dinero", "GETESA number"), bank()],
  },
  {
    code: "NG",
    name: "Nigeria",
    flag: "🇳🇬",
    currency: "NGN",
    dial: "+234",
    region: "West Africa",
    rate: 2.34,
    eta: "Minutes",
    rails: [bank("10-digit NUBAN account number"), momo("OPay", "OPay number"), momo("PalmPay", "PalmPay number")],
  },
  {
    code: "GH",
    name: "Ghana",
    flag: "🇬🇭",
    currency: "GHS",
    dial: "+233",
    region: "West Africa",
    rate: 0.02,
    eta: "Minutes",
    rails: [momo("MTN MoMo", "MTN number"), momo("Telecel Cash", "Telecel number"), momo("AT Money", "AirtelTigo number"), bank()],
  },
  {
    code: "CI",
    name: "Côte d'Ivoire",
    short: "Ivory Coast",
    flag: "🇨🇮",
    currency: "XOF",
    dial: "+225",
    region: "West Africa",
    rate: 1,
    eta: "Minutes",
    rails: [momo("Orange Money", "Orange number"), momo("MTN MoMo", "MTN number"), momo("Wave", "Wave number"), bank()],
  },
  {
    code: "SN",
    name: "Senegal",
    flag: "🇸🇳",
    currency: "XOF",
    dial: "+221",
    region: "West Africa",
    rate: 1,
    eta: "Minutes",
    rails: [momo("Wave", "Wave number"), momo("Orange Money", "Orange number"), momo("Free Money", "Free number"), bank()],
  },
];

export const INTERNATIONAL = {
  /** Fee on the XAF amount sent. */
  feeRate: 0.025,
  minFee: 250,
  min: 1_000,
  max: 1_000_000,
  /** Cross-currency corridors carry a small FX spread on top of the mid rate. */
  fxSpread: 0.01,
} as const;

export const CURRENCY_NAMES: Record<CorridorCurrency, string> = {
  XAF: "Central African CFA franc",
  XOF: "West African CFA franc",
  NGN: "Nigerian naira",
  GHS: "Ghanaian cedi",
};

export function findCountry(code: string) {
  return COUNTRIES.find((c) => c.code === code.toUpperCase()) || null;
}

export function findRail(country: Country, railId: string) {
  return country.rails.find((r) => r.id === railId) || null;
}

/** Effective rate after spread. Same-currency corridors are 1:1 with no spread. */
export function effectiveRate(country: Country) {
  if (country.currency === "XAF" || country.currency === "XOF") return 1;
  return Math.round(country.rate * (1 - INTERNATIONAL.fxSpread) * 10_000) / 10_000;
}

export function internationalFee(amount: number) {
  if (!amount) return 0;
  return Math.max(INTERNATIONAL.minFee, Math.round(amount * INTERNATIONAL.feeRate));
}

export type Quote = {
  country: Country;
  amount: number;
  fee: number;
  total: number;
  rate: number;
  receiveAmount: number;
  currency: CorridorCurrency;
};

export function quote(country: Country, amount: number): Quote {
  const rate = effectiveRate(country);
  const fee = internationalFee(amount);
  const receive = country.currency === "NGN" || country.currency === "GHS" ? Math.round(amount * rate * 100) / 100 : Math.round(amount * rate);
  return { country, amount, fee, total: amount + fee, rate, receiveAmount: receive, currency: country.currency };
}

export function formatLocal(amount: number, currency: CorridorCurrency) {
  if (currency === "XAF" || currency === "XOF") {
    return `${new Intl.NumberFormat("fr-CM", { maximumFractionDigits: 0 }).format(amount)} ${currency === "XAF" ? "FCFA" : "CFA"}`;
  }
  const symbol = currency === "NGN" ? "₦" : "GH₵";
  return `${symbol}${new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
}

export function internationalIssue(amount: number) {
  if (!amount) return "";
  if (amount < INTERNATIONAL.min) return `Minimum transfer abroad is ${INTERNATIONAL.min.toLocaleString("fr-CM")} XAF.`;
  if (amount > INTERNATIONAL.max) return `Maximum per transfer abroad is ${INTERNATIONAL.max.toLocaleString("fr-CM")} XAF.`;
  return "";
}

/** Loose recipient validation per rail. Partners do the strict check. */
export function recipientIssue(country: Country, rail: PayoutRail, value: string) {
  const digits = value.replace(/\D/g, "");
  if (rail.field === "phone") {
    if (digits.length < 8 || digits.length > 13) return `Enter a valid ${country.name} mobile number.`;
    return "";
  }
  if (digits.length < 8 || digits.length > 24) return "Enter a valid account number.";
  return "";
}
