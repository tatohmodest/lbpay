import { NextResponse } from "next/server";
import { findUserById } from "@/lib/server/db";
import { readAdminSession, readSession } from "@/lib/server/session";
import { hasKind, isAdmin, shouldSkipAdminOtp } from "@/lib/roles";
import type { AccountKind } from "@/lib/types";

export async function currentUser() {
  const session = await readSession();
  if (!session) return null;
  return findUserById(session.userId);
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }), user: null };
  }
  return { error: null, user };
}

export async function requireActiveUser() {
  const result = await requireUser();
  if (result.error || !result.user) return result;
  if (result.user.status === "frozen") {
    return {
      error: NextResponse.json({ error: "This account is frozen. Contact support." }, { status: 403 }),
      user: null,
    };
  }
  return result;
}

export async function requireKind(kind: AccountKind) {
  const result = await requireActiveUser();
  if (result.error || !result.user) return result;
  if (!hasKind(result.user, kind)) {
    return {
      error: NextResponse.json({ error: `This action needs the ${kind} role.` }, { status: 403 }),
      user: null,
    };
  }
  if (
    (kind === "developer" || kind === "business") &&
    result.user.kyc[kind] !== "verified" &&
    !isAdmin(result.user)
  ) {
    return {
      error: NextResponse.json({ error: "This product unlocks after your application is approved." }, { status: 403 }),
      user: null,
    };
  }
  return result;
}

export async function requireAdmin() {
  const result = await requireUser();
  if (result.error || !result.user) return result;
  if (!isAdmin(result.user)) {
    return { error: NextResponse.json({ error: "Admin only." }, { status: 403 }), user: null };
  }
  if (shouldSkipAdminOtp(result.user)) {
    return result;
  }
  const step = await readAdminSession();
  if (!step || step.userId !== result.user.id) {
    return {
      error: NextResponse.json({ error: "Admin OTP required.", needOtp: true }, { status: 401 }),
      user: null,
    };
  }
  return result;
}
