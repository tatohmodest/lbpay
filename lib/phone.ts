/** Cameroon Mobile Money MSISDN: 9 digits, no country code. */
export function cameroonMsisdn(raw: string | undefined | null) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  while (digits.startsWith("237") && digits.length > 9) {
    digits = digits.slice(3);
  }
  if (digits.startsWith("0") && digits.length === 10) digits = digits.slice(1);
  if (digits.length > 9) digits = digits.slice(-9);
  return digits;
}

export function isCameroonMsisdn(raw: string | undefined | null) {
  return /^6\d{8}$/.test(cameroonMsisdn(raw));
}

export function detectMobileNetwork(raw: string | undefined | null): "mtn" | "orange" | "other" {
  const n = cameroonMsisdn(raw);
  if (!isCameroonMsisdn(n)) return "other";
  const p2 = n.slice(0, 2);
  const p3 = Number(n.slice(0, 3));
  if (p2 === "67" || p2 === "68") return "mtn";
  if (p3 >= 650 && p3 <= 654) return "mtn";
  if (p2 === "69") return "orange";
  if (p3 >= 655 && p3 <= 659) return "orange";
  if (p3 >= 640 && p3 <= 649) return "orange";
  return "other";
}
