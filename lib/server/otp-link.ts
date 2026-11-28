import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * Codes go out as a link, not as digits in the email: the email only carries a
 * sealed token, and the code is shown on LBPay's own page after the link is opened.
 * Scripts that read the inbox for 6 digits find nothing.
 */
export type CodePurpose = "verify" | "admin" | "reset" | "pin";

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required.");
  return createHash("sha256").update(`lbpay-otp-link:${secret}`).digest();
}

export function sealCode(code: string, purpose: CodePurpose, exp: number) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify({ c: code, p: purpose, e: exp }), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function openCode(token: string): { code: string; purpose: CodePurpose; exp: number } | null {
  try {
    const raw = Buffer.from(String(token || ""), "base64url");
    if (raw.length < 29) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const text = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(text) as { c?: unknown; p?: unknown; e?: unknown };
    if (typeof parsed.c !== "string" || typeof parsed.e !== "number") return null;
    if (parsed.e < Date.now()) return null;
    const purpose = (["verify", "admin", "reset", "pin"] as const).find((p) => p === parsed.p) || "verify";
    return { code: parsed.c, purpose, exp: parsed.e };
  } catch {
    return null;
  }
}
