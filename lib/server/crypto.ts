import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCb);

export async function hashSecret(secret: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(secret, salt, 32)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifySecret(secret: string, stored: string) {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const derived = (await scrypt(secret, salt, 32)) as Buffer;
  const expected = Buffer.from(hex, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function payunitReference(prefix = "LBPAY") {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString("hex").toUpperCase()}`;
}

export function signValue(value: string, secret: string) {
  return `${value}.${createHmac("sha256", secret).update(value).digest("hex")}`;
}

export function unsignValue(signed: string, secret: string) {
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = createHmac("sha256", secret).update(value).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? value : null;
}
