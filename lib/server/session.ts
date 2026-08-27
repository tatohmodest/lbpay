import { cookies } from "next/headers";
import { signValue, unsignValue } from "./crypto";

const COOKIE = "lbpay_sid";
const PREAUTH = "lbpay_preauth";
const ADMIN = "lbpay_admin";

export const SESSION_TTL_SEC = 30 * 24 * 60 * 60;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET is required.");
  }
  return value;
}

export type SessionPayload = {
  userId: string;
  exp: number;
};

export async function createSession(userId: string, maxAgeSec: number) {
  const exp = Date.now() + maxAgeSec * 1000;
  const token = signValue(JSON.stringify({ userId, exp } satisfies SessionPayload), secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSec,
  });
}

export async function setPreauth(
  userId: string,
  step: "otp" | "pin" | "pin-setup" | "reset" | "pin-reset" | "pin-reset-pin",
) {
  const exp = Date.now() + 10 * 60 * 1000;
  const token = signValue(JSON.stringify({ userId, step, exp }), secret());
  const jar = await cookies();
  jar.set(PREAUTH, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });
}

export async function readPreauth() {
  const jar = await cookies();
  const raw = jar.get(PREAUTH)?.value;
  if (!raw) return null;
  const value = unsignValue(raw, secret());
  if (!value) return null;
  const parsed = JSON.parse(value) as { userId: string; step: string; exp: number };
  if (parsed.exp < Date.now()) return null;
  return parsed;
}

export async function clearPreauth() {
  const jar = await cookies();
  jar.delete(PREAUTH);
}

export async function readSession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const value = unsignValue(raw, secret());
  if (!value) return null;
  const parsed = JSON.parse(value) as SessionPayload;
  if (parsed.exp < Date.now()) return null;
  return parsed;
}

export async function createAdminSession(userId: string, maxAgeSec = 20 * 60) {
  const exp = Date.now() + maxAgeSec * 1000;
  const token = signValue(JSON.stringify({ userId, exp, scope: "admin" }), secret());
  const jar = await cookies();
  jar.set(ADMIN, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSec,
  });
}

export async function readAdminSession() {
  const jar = await cookies();
  const raw = jar.get(ADMIN)?.value;
  if (!raw) return null;
  const value = unsignValue(raw, secret());
  if (!value) return null;
  const parsed = JSON.parse(value) as { userId: string; exp: number; scope?: string };
  if (parsed.exp < Date.now()) return null;
  return parsed;
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN);
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(PREAUTH);
  jar.delete(ADMIN);
}
