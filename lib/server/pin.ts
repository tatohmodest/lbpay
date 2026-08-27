import { NextResponse } from "next/server";
import { verifySecret } from "@/lib/server/crypto";
import { upsertUser, type StoredUser } from "@/lib/server/db";

export const PIN_MAX_FAILS = 4;
export const PIN_LOCK_MS = 60_000;

export type PinCheck =
  | { ok: true }
  | { ok: false; status: number; error: string; retryAfter?: number; lockedUntil?: number };

export function pinLockSeconds(until: number) {
  return Math.max(1, Math.ceil((until - Date.now()) / 1000));
}

export function pinLockMessage(until: number) {
  const seconds = pinLockSeconds(until);
  return `Too many incorrect PINs. Try again in ${seconds}s.`;
}

export function pinFailResponse(result: Extract<PinCheck, { ok: false }>) {
  return NextResponse.json(
    { error: result.error, retryAfter: result.retryAfter, lockedUntil: result.lockedUntil },
    { status: result.status },
  );
}

export async function verifyUserPin(user: StoredUser, pin: string): Promise<PinCheck> {
  const lockedUntil = user.pinLockedUntil || 0;
  if (lockedUntil > Date.now()) {
    return {
      ok: false,
      status: 429,
      error: pinLockMessage(lockedUntil),
      retryAfter: pinLockSeconds(lockedUntil),
      lockedUntil,
    };
  }

  if (!user.pinHash) {
    return { ok: false, status: 400, error: "PIN required." };
  }

  const ok = await verifySecret(String(pin || ""), user.pinHash);
  if (!ok) {
    const fails = (user.pinFailCount || 0) + 1;
    if (fails >= PIN_MAX_FAILS) {
      user.pinFailCount = 0;
      user.pinLockedUntil = Date.now() + PIN_LOCK_MS;
      await upsertUser(user);
      return {
        ok: false,
        status: 429,
        error: pinLockMessage(user.pinLockedUntil),
        retryAfter: PIN_LOCK_MS / 1000,
        lockedUntil: user.pinLockedUntil,
      };
    }
    user.pinFailCount = fails;
    user.pinLockedUntil = 0;
    await upsertUser(user);
    const left = PIN_MAX_FAILS - fails;
    return {
      ok: false,
      status: 401,
      error:
        left === 1
          ? "Incorrect PIN. 1 try left before a 1 minute lock."
          : `Incorrect PIN. ${left} tries left.`,
    };
  }

  if (user.pinFailCount || user.pinLockedUntil) {
    user.pinFailCount = 0;
    user.pinLockedUntil = 0;
    await upsertUser(user);
  }
  return { ok: true };
}
