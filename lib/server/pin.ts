import { NextResponse } from "next/server";
import { verifySecret } from "@/lib/server/crypto";
import { serialByKey } from "@/lib/server/serial";
import { findUserById, upsertUser, type StoredUser } from "@/lib/server/db";

export const PIN_MAX_FAILS = 4;
export const PIN_LOCK_MS = 60_000;
const PIN_LOCK_MAX_MS = 24 * 60 * 60 * 1000;

/** 1 min, 5 min, 25 min, about 2 h, about 10 h, then 24 h: a 4-digit PIN can't be guessed in days. */
export function pinLockDuration(locksSoFar: number) {
  return Math.min(PIN_LOCK_MAX_MS, PIN_LOCK_MS * 5 ** Math.max(0, locksSoFar));
}

export type PinCheck =
  | { ok: true }
  | { ok: false; status: number; error: string; retryAfter?: number; lockedUntil?: number };

export function pinLockSeconds(until: number) {
  return Math.max(1, Math.ceil((until - Date.now()) / 1000));
}

export function waitCopy(seconds: number) {
  if (seconds < 90) return `${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 90) return `${minutes} min`;
  return `${Math.ceil(minutes / 60)} h`;
}

export function pinLockMessage(until: number) {
  return `Too many incorrect PINs. Try again in ${waitCopy(pinLockSeconds(until))}.`;
}

export function pinFailResponse(result: Extract<PinCheck, { ok: false }>) {
  return NextResponse.json(
    { error: result.error, retryAfter: result.retryAfter, lockedUntil: result.lockedUntil },
    { status: result.status },
  );
}

/**
 * One PIN check at a time per account, each reading the latest fail count.
 * Without this, 100 guesses sent at once all see "0 fails" and the lock never trips.
 */
export async function verifyUserPin(user: StoredUser, pin: string): Promise<PinCheck> {
  return serialByKey(`pin:${user.id}`, () => checkPinNow(user, pin));
}

async function checkPinNow(given: StoredUser, pin: string): Promise<PinCheck> {
  const fresh = await findUserById(given.id);
  const user = fresh || given;
  // Keep the caller's copy in step, since routes save it again afterwards.
  if (fresh && fresh !== given) {
    given.pinFailCount = fresh.pinFailCount;
    given.pinLockedUntil = fresh.pinLockedUntil;
    given.pinLockCount = fresh.pinLockCount;
    given.pinHash = fresh.pinHash;
  }
  const result = await checkPinFor(user, pin);
  if (fresh && fresh !== given) {
    given.pinFailCount = user.pinFailCount;
    given.pinLockedUntil = user.pinLockedUntil;
    given.pinLockCount = user.pinLockCount;
  }
  return result;
}

async function checkPinFor(user: StoredUser, pin: string): Promise<PinCheck> {
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
      const lockMs = pinLockDuration(user.pinLockCount || 0);
      user.pinFailCount = 0;
      user.pinLockCount = (user.pinLockCount || 0) + 1;
      user.pinLockedUntil = Date.now() + lockMs;
      await upsertUser(user);
      return {
        ok: false,
        status: 429,
        error: pinLockMessage(user.pinLockedUntil),
        retryAfter: Math.ceil(lockMs / 1000),
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
          ? `Incorrect PIN. 1 try left before a ${waitCopy(Math.ceil(pinLockDuration(user.pinLockCount || 0) / 1000))} lock.`
          : `Incorrect PIN. ${left} tries left.`,
    };
  }

  if (user.pinFailCount || user.pinLockedUntil || user.pinLockCount) {
    user.pinFailCount = 0;
    user.pinLockedUntil = 0;
    user.pinLockCount = 0;
    await upsertUser(user);
  }
  return { ok: true };
}
