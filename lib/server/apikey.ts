import { NextResponse } from "next/server";
import { addLog, findKeyBySecret, findUserById, getWallet, regenerateApiKey } from "@/lib/server/db";
import { issueApiKey } from "@/lib/server/crypto";
import { uid } from "@/lib/format";
import type { StoredUser } from "@/lib/server/db";
import { getPaymentRail } from "@/lib/providers";
import type { PaymentRail } from "@/lib/providers/types";
import { isAdmin } from "@/lib/roles";

export async function authenticateApiKey(request: Request): Promise<
  | { ok: true; user: StoredUser; env: "sandbox" | "live" }
  | { ok: false; error: NextResponse }
> {
  const header = request.headers.get("authorization") || "";
  const secret = header.replace(/^Bearer\s+/i, "").trim();
  if (!secret.startsWith("sk_test_") && !secret.startsWith("sk_live_")) {
    return { ok: false, error: NextResponse.json({ error: "Invalid API key" }, { status: 401 }) };
  }
  const key = await findKeyBySecret(secret);
  if (!key) {
    return { ok: false, error: NextResponse.json({ error: "Invalid API key" }, { status: 401 }) };
  }
  const user = await findUserById(key.userId);
  if (!user || user.status === "frozen") {
    return { ok: false, error: NextResponse.json({ error: "Account unavailable" }, { status: 403 }) };
  }
  if (key.env === "live" && user.kyc.developer !== "verified" && !isAdmin(user)) {
    return {
      ok: false,
      error: NextResponse.json({ error: "Live keys need approved developer KYC." }, { status: 403 }),
    };
  }
  return { ok: true, user, env: key.env };
}

export function railForEnv(env: "sandbox" | "live"): PaymentRail {
  return getPaymentRail(env);
}

export async function issueKeyForEnv(user: StoredUser, env: "sandbox" | "live") {
  const issued = await issueApiKey(env);
  const row = await regenerateApiKey(user.id, env, {
    publicKey: issued.publicKey,
    secretHash: issued.secretHash,
    secretMasked: issued.secretMasked,
  });
  return { ...issued, id: row.id, env };
}

export async function issueSandboxKey(user: StoredUser) {
  return issueKeyForEnv(user, "sandbox");
}

export async function issueLiveKey(user: StoredUser) {
  return issueKeyForEnv(user, "live");
}

export async function logApi(userId: string, method: "GET" | "POST" | "PUT" | "DELETE", path: string, status: number) {
  await addLog({
    id: uid("log"),
    userId,
    status,
    method,
    path,
    createdAt: new Date().toISOString(),
  });
}

export async function merchantBalance(userId: string) {
  const wallet = await getWallet(userId);
  return wallet.balance;
}
