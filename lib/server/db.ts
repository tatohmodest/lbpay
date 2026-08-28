import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { verifySecret } from "./crypto";
import { isBootstrapAdmin } from "@/lib/roles";
import { uid } from "@/lib/format";
import { handleBase, isReservedHandle, normalizeHandle, numberedHandle } from "@/lib/handle";
import { cameroonMsisdn } from "@/lib/phone";
import { normalizeLinkTemplate } from "@/lib/link-templates";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  AccountKind,
  AccountStatus,
  ApiLog,
  KycState,
  KycTrack,
  PaymentLink,
  PaymentMethod,
  Transaction,
  TransactionKind,
  TransactionStatus,
  WebhookEndpoint,
} from "@/lib/types";

export type StoredUser = {
  id: string;
  name: string;
  lbpayId: string;
  email: string;
  phone: string;
  avatar: string;
  passwordHash: string;
  pinHash: string | null;
  pinFailCount?: number;
  pinLockedUntil?: number;
  emailVerified: boolean;
  kycStatus: KycState;
  roles: AccountKind[];
  status: AccountStatus;
  kyc: Record<KycTrack, KycState>;
  businessName?: string;
  createdAt: string;
};

export type StoredOtp = {
  email: string;
  hash: string;
  exp: number;
  attempts: number;
};

export type StoredWallet = {
  userId: string;
  balance: number;
};

export type StoredTx = Transaction & {
  userId: string;
  counterpartyId?: string;
  rail?: "internal" | "payunit" | "sandbox";
  meta?: {
    from?: string;
    to?: string;
    fromNetwork?: "mtn" | "orange";
    toNetwork?: "mtn" | "orange";
    stage?: "collecting" | "paying" | "done";
    payoutRef?: string;
    linkSlug?: string;
    handle?: string;
    refunded?: boolean;
  };
};

export type KycApplication = {
  id: string;
  userId: string;
  track: KycTrack;
  status: "pending" | "approved" | "rejected";
  legalName: string;
  idNumber: string;
  phone: string;
  businessName?: string;
  taxId?: string;
  website?: string;
  documentType?: "national_id" | "passport";
  documents?: {
    idFrontUrl: string;
    idBackUrl: string;
    selfieUrl: string;
    idFrontId?: string;
    idBackId?: string;
    selfieId?: string;
  };
  note?: string;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

export type StoredApiKey = {
  id: string;
  userId: string;
  env: "sandbox" | "live";
  publicKey: string;
  secretHash: string;
  secretMasked: string;
  createdAt: string;
  revokedAt?: string;
};

export type AuditEntry = {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  note?: string;
  createdAt: string;
  meta?: Record<string, unknown>;
};

export type StoredWebhook = WebhookEndpoint & { userId: string };
export type StoredLink = PaymentLink & { userId: string };
export type StoredLog = ApiLog & { userId: string };

export type StoredPushSubscription = {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
};

export type DbShape = {
  users: StoredUser[];
  otps: StoredOtp[];
  wallets: StoredWallet[];
  transactions: StoredTx[];
  kyc: KycApplication[];
  keys: StoredApiKey[];
  audit: AuditEntry[];
  webhooks: StoredWebhook[];
  links: StoredLink[];
  logs: StoredLog[];
  pushSubscriptions: StoredPushSubscription[];
  vapid?: { publicKey: string; privateKey: string };
};

const LOCAL_FILE = path.join(process.cwd(), "data", "lbpay.json");
const TMP_FILE = path.join("/tmp", "lbpay.json");

let filePath = LOCAL_FILE;
let cache: DbShape | null = null;
let seeding: Promise<void> | null = null;

function candidateFiles() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return [TMP_FILE];
  }
  return [LOCAL_FILE, TMP_FILE];
}

function remoteConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function accountRowId(email: string) {
  return `user:${email.trim().toLowerCase()}`;
}

function mergeById<T extends { id: string }>(base: T[] = [], next: T[] = []) {
  const map = new Map<string, T>();
  for (const item of base) map.set(item.id, item);
  for (const item of next) map.set(item.id, item);
  return [...map.values()];
}

function mergeLedgers(base: DbShape, next: DbShape): DbShape {
  const users = new Map<string, StoredUser>();
  for (const user of [...(base.users || []), ...(next.users || [])]) {
    users.set(user.email.trim().toLowerCase(), user);
  }
  const wallets = new Map<string, StoredWallet>();
  for (const wallet of [...(base.wallets || []), ...(next.wallets || [])]) {
    wallets.set(wallet.userId, wallet);
  }
  return {
    ...next,
    users: [...users.values()].map(normalizeUser),
    wallets: [...wallets.values()],
    transactions: mergeById(base.transactions, next.transactions),
    kyc: mergeById(base.kyc, next.kyc),
    keys: mergeById(base.keys, next.keys),
    audit: mergeById(base.audit, next.audit),
    webhooks: mergeById(base.webhooks, next.webhooks),
    links: mergeById(base.links, next.links),
    logs: mergeById(base.logs, next.logs),
    pushSubscriptions: [
      ...new Map(
        [...(base.pushSubscriptions || []), ...(next.pushSubscriptions || [])].map((item) => [item.endpoint, item]),
      ).values(),
    ],
    otps: next.otps || [],
    vapid: next.vapid || base.vapid,
  };
}

function normalizeUser(user: StoredUser): StoredUser {
  const kyc = user.kyc ?? {
    personal: user.kycStatus ?? "unverified",
    business: "unverified",
    developer: "unverified",
  };
  const roles = user.roles?.length ? user.roles : (["personal"] as AccountKind[]);
  if (isBootstrapAdmin(user.email) && !roles.includes("admin")) roles.push("admin");
  return {
    ...user,
    phone: cameroonMsisdn(user.phone) || user.phone,
    roles,
    status: user.status ?? "active",
    kyc,
    kycStatus: kyc.personal,
  };
}

async function empty(): Promise<DbShape> {
  return {
    users: [],
    otps: [],
    wallets: [],
    transactions: [],
    kyc: [],
    keys: [],
    audit: [],
    webhooks: [],
    links: [],
    logs: [],
    pushSubscriptions: [],
  };
}

function withCollections(db: DbShape): DbShape {
  return {
    users: (db.users || []).map(normalizeUser),
    otps: db.otps || [],
    wallets: db.wallets || [],
    transactions: db.transactions || [],
    kyc: db.kyc || [],
    keys: db.keys || [],
    audit: db.audit || [],
    webhooks: db.webhooks || [],
    links: db.links || [],
    logs: db.logs || [],
    pushSubscriptions: db.pushSubscriptions || [],
    vapid: db.vapid,
  };
}

async function loadRemote(): Promise<DbShape | null> {
  const sb = supabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.from("app_ledger").select("data").eq("id", "lbpay").maybeSingle();
  if (error) {
    console.error("[lbpay] could not read the ledger from Supabase", error.message);
    return null;
  }
  if (!data?.data) return null;
  return withCollections(data.data as DbShape);
}

type AccountRow = { user: StoredUser; wallet?: StoredWallet };

async function loadAccountRows(): Promise<AccountRow[]> {
  const sb = supabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb.from("app_ledger").select("id,data").like("id", "user:%");
  if (error) {
    console.error("[lbpay] could not read saved accounts", error.message);
    return [];
  }
  return (data || [])
    .map((row) => row.data as AccountRow)
    .filter((row) => row?.user?.id && row.user.email);
}

async function loadAccount(email: string): Promise<AccountRow | null> {
  const sb = supabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.from("app_ledger").select("data").eq("id", accountRowId(email)).maybeSingle();
  if (error) {
    console.error("[lbpay] could not read account", email, error.message);
    return null;
  }
  const row = data?.data as AccountRow | undefined;
  return row?.user?.id ? row : null;
}

function applyAccounts(db: DbShape, rows: AccountRow[]): DbShape {
  const next = { ...db, users: [...db.users], wallets: [...db.wallets] };
  for (const row of rows) {
    const user = normalizeUser(row.user);
    const idx = next.users.findIndex(
      (item) => item.id === user.id || item.email.toLowerCase() === user.email.toLowerCase(),
    );
    if (idx >= 0) next.users[idx] = { ...next.users[idx], ...user, roles: user.roles };
    else next.users.push(user);
    if (row.wallet) {
      const widx = next.wallets.findIndex((item) => item.userId === user.id);
      if (widx >= 0) next.wallets[widx] = row.wallet;
      else next.wallets.push(row.wallet);
    } else if (!next.wallets.some((item) => item.userId === user.id)) {
      next.wallets.push({ userId: user.id, balance: 0 });
    }
  }
  return next;
}

function handleRowId(handle: string) {
  return `handle:${normalizeHandle(handle)}`;
}

async function claimHandle(handle: string, userId: string) {
  const sb = supabaseAdmin();
  if (!sb) return;
  const id = handleRowId(handle);
  const { data } = await sb.from("app_ledger").select("data").eq("id", id).maybeSingle();
  const owner = (data?.data as { userId?: string } | undefined)?.userId;
  if (owner && owner !== userId) {
    throw new Error(`@${handle} is already taken.`);
  }
  if (owner === userId) return;
  const { error } = await sb.from("app_ledger").insert({
    id,
    data: { userId },
    updated_at: new Date().toISOString(),
  });
  if (error) {
    if (error.code === "23505" || /duplicate|already exists/i.test(error.message)) {
      throw new Error(`@${handle} is already taken.`);
    }
    console.error("[lbpay] could not reserve LBPay ID", handle, error.message);
    throw new Error("Could not save the LBPay ID. Try again.");
  }
}

async function persistAccount(user: StoredUser, wallet?: StoredWallet) {
  const sb = supabaseAdmin();
  if (!sb) {
    if (remoteConfigured()) {
      throw new Error("Could not save the account. Storage is not connected.");
    }
    return;
  }
  const { error } = await sb.from("app_ledger").upsert({
    id: accountRowId(user.email),
    data: { user, wallet: wallet || { userId: user.id, balance: 0 } },
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("[lbpay] could not save account", user.email, error.message);
    throw new Error("Could not save the account. Try again.");
  }
}

async function persistAllAccounts(db: DbShape) {
  for (const user of db.users) {
    const wallet = db.wallets.find((item) => item.userId === user.id);
    await persistAccount(user, wallet);
  }
}

async function saveRemote(db: DbShape) {
  const sb = supabaseAdmin();
  if (!sb) return false;
  if (!db.users.length) {
    const existing = await loadRemote();
    if (existing?.users?.length) {
      console.error("[lbpay] refused to overwrite saved accounts with an empty ledger");
      return false;
    }
  }
  const { error } = await sb.from("app_ledger").upsert({
    id: "lbpay",
    data: db,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("[lbpay] could not save the ledger to Supabase", error.message);
    return false;
  }
  return true;
}

async function readDb(): Promise<DbShape> {
  if (cache && !remoteConfigured()) return cache;
  let loaded: DbShape | null = null;
  const remote = await loadRemote();
  if (remote) loaded = remote;
  if (!loaded) {
    for (const file of candidateFiles()) {
      try {
        const raw = await readFile(file, "utf8");
        loaded = withCollections(JSON.parse(raw) as DbShape);
        filePath = file;
        break;
      } catch {
        /* try the next location */
      }
    }
  }
  if (!loaded) loaded = await empty();
  loaded = applyAccounts(loaded, await loadAccountRows());
  cache = loaded;
  if (!remoteConfigured() && !remote) {
    try {
      await writeFileSafe(cache);
    } catch (error) {
      console.error("[lbpay] could not initialize the data file", error);
    }
  }
  return cache;
}

async function writeFileSafe(db: DbShape) {
  const payload = JSON.stringify(db, null, 2);
  const targets = [filePath, ...candidateFiles().filter((item) => item !== filePath)];
  let lastError: unknown;
  for (const file of targets) {
    try {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, payload, "utf8");
      filePath = file;
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not save account data.");
}

async function writeDb(db: DbShape) {
  const remote = remoteConfigured() ? await loadRemote() : null;
  const merged = remote ? mergeLedgers(remote, db) : db;
  cache = merged;
  await persistAllAccounts(merged);
  const remoteOk = await saveRemote(merged);
  if (remoteConfigured() && !remoteOk) {
    throw new Error("Could not save the account. Try again.");
  }
  if (!remoteConfigured()) {
    await writeFileSafe(merged);
  }
}

export async function getDb() {
  if (!seeding) seeding = readDb().then(() => undefined);
  await seeding;
  return readDb();
}

export async function saveDb(db: DbShape) {
  await writeDb(db);
}

export async function findUserByEmail(email: string) {
  const needle = email.trim().toLowerCase();
  const db = await getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === needle);
  if (user) return normalizeUser(user);
  const stored = await loadAccount(needle);
  if (!stored?.user) return null;
  if (cache) cache = applyAccounts(cache, [stored]);
  return normalizeUser(stored.user);
}

export async function findUserByHandle(handle: string) {
  const db = await getDb();
  const id = handle.replace(/^@/, "").trim().toLowerCase();
  if (!id) return null;
  const user = db.users.find((u) => u.lbpayId.toLowerCase() === id) ?? null;
  return user ? normalizeUser(user) : null;
}

export async function isHandleTaken(handle: string, exceptUserId?: string) {
  const user = await findUserByHandle(handle);
  if (user && user.id !== exceptUserId) return true;
  const sb = supabaseAdmin();
  if (!sb) return false;
  const { data } = await sb.from("app_ledger").select("data").eq("id", handleRowId(handle)).maybeSingle();
  const owner = (data?.data as { userId?: string } | undefined)?.userId;
  return Boolean(owner && owner !== exceptUserId);
}

export async function nextAvailableHandle(desired: string, exceptUserId?: string) {
  const requested = normalizeHandle(desired);
  const base = handleBase(requested) || "user";
  const trailing = requested.match(/^(.*?)(\d+)$/);
  let n = trailing?.[1] && handleBase(trailing[1]) === base ? Number(trailing[2]) || 1 : 1;
  if (!Number.isFinite(n) || n < 1) n = 1;
  for (let i = 0; i < 10000; i += 1) {
    const candidate = numberedHandle(base, n);
    if (!isReservedHandle(candidate) && !(await isHandleTaken(candidate, exceptUserId))) {
      return candidate;
    }
    n += 1;
  }
  throw new Error("Could not create a unique LBPay ID.");
}

export async function findUserById(id: string) {
  const db = await getDb();
  const user = db.users.find((u) => u.id === id) ?? null;
  return user ? normalizeUser(user) : null;
}

export async function listUsers() {
  const db = await getDb();
  return db.users.map(normalizeUser);
}

export async function upsertUser(user: StoredUser) {
  const handle = normalizeHandle(user.lbpayId);
  if (!handle || isReservedHandle(handle)) {
    throw new Error("Choose a different LBPay ID.");
  }
  user.lbpayId = handle;
  const db = await getDb();
  const clash = db.users.find(
    (item) => item.lbpayId.toLowerCase() === handle && item.id !== user.id && item.email.toLowerCase() !== user.email.toLowerCase(),
  );
  if (clash) {
    throw new Error(`@${handle} is already taken.`);
  }
  const idx = db.users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  if (idx >= 0) db.users[idx] = user;
  else db.users.push(user);
  let wallet = db.wallets.find((w) => w.userId === user.id);
  if (!wallet) {
    wallet = { userId: user.id, balance: 0 };
    db.wallets.push(wallet);
  }
  await persistAccount(user, wallet);
  await claimHandle(user.lbpayId, user.id);
  await saveDb(db);
  return user;
}

export async function getWallet(userId: string) {
  await refundUndeliveredSpends(userId);
  const db = await getDb();
  let wallet = db.wallets.find((w) => w.userId === userId);
  if (!wallet) {
    wallet = { userId, balance: 0 };
    db.wallets.push(wallet);
    await saveDb(db);
  }
  return wallet;
}

export async function refundUndeliveredSpends(userId?: string) {
  const db = await getDb();
  let changed = false;
  const now = new Date().toISOString();
  for (const tx of [...db.transactions]) {
    if (userId && tx.userId !== userId) continue;
    if (tx.kind !== "airtime" && tx.kind !== "bill") continue;
    if (tx.status !== "success") continue;
    if (tx.rail && tx.rail !== "internal") continue;
    if (tx.meta?.refunded) continue;
    const wallet = db.wallets.find((item) => item.userId === tx.userId);
    if (!wallet) continue;
    wallet.balance += tx.amount + (tx.fee || 0);
    tx.status = "failed";
    tx.meta = { ...tx.meta, refunded: true };
    const reversal: StoredTx = {
      id: uid("TXN"),
      userId: tx.userId,
      kind: "reversal",
      amount: tx.amount,
      fee: 0,
      status: "success",
      method: "wallet",
      counterparty: tx.counterparty,
      note: "Refund because this service was not delivered",
      createdAt: now,
      rail: "internal",
      meta: { from: tx.id, refunded: true },
    };
    db.transactions.unshift(reversal);
    changed = true;
  }
  if (changed) await saveDb(db);
}

export async function listTx(userId: string) {
  const db = await getDb();
  return db.transactions
    .filter((tx) => tx.userId === userId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function recordTransfer(params: {
  from: StoredUser;
  to: StoredUser;
  amount: number;
  note?: string;
}) {
  const db = await getDb();
  const source = db.wallets.find((w) => w.userId === params.from.id);
  const dest = db.wallets.find((w) => w.userId === params.to.id);
  if (!source || !dest) throw new Error("Wallet missing");
  if (source.balance < params.amount) {
    const err = new Error("Insufficient wallet balance");
    throw err;
  }
  source.balance -= params.amount;
  dest.balance += params.amount;
  const now = new Date().toISOString();
  const outId = `TXN_${Date.now().toString(36).toUpperCase()}`;
  const inId = `${outId}R`;
  const outgoing: StoredTx = {
    id: outId,
    userId: params.from.id,
    kind: "send",
    amount: params.amount,
    fee: 0,
    status: "success",
    method: "wallet",
    counterparty: `@${params.to.lbpayId}`,
    counterpartyId: params.to.id,
    note: params.note || "LBPay wallet transfer",
    createdAt: now,
    rail: "internal",
  };
  const incoming: StoredTx = {
    id: inId,
    userId: params.to.id,
    kind: "receive",
    amount: params.amount,
    fee: 0,
    status: "success",
    method: "wallet",
    counterparty: `@${params.from.lbpayId}`,
    counterpartyId: params.from.id,
    note: params.note || "LBPay wallet transfer",
    createdAt: now,
    rail: "internal",
  };
  db.transactions.unshift(outgoing, incoming);
  await saveDb(db);
  await emitPush((mod) => mod.pushForTransaction(incoming));
  return { outgoing, incoming, sourceBalance: source.balance };
}

export async function recordLedgerMove(params: {
  userId: string;
  amount: number;
  direction: "credit" | "debit";
  kind: TransactionKind;
  method: PaymentMethod;
  counterparty: string;
  note?: string;
  status?: TransactionStatus;
  rail?: StoredTx["rail"];
  railRef?: string;
  fee?: number;
  meta?: StoredTx["meta"];
}) {
  const db = await getDb();
  const wallet = db.wallets.find((w) => w.userId === params.userId);
  if (!wallet) throw new Error("Wallet missing");
  const status = params.status ?? "success";
  const fee = Math.max(0, Math.round(params.fee || 0));
  const debitTotal = params.amount + (params.direction === "debit" ? fee : 0);
  const applyNow =
    params.direction === "debit" || (params.direction === "credit" && status === "success");
  if (params.direction === "debit" && wallet.balance < debitTotal) {
    throw new Error("Insufficient wallet balance");
  }
  if (applyNow) {
    wallet.balance += params.direction === "credit" ? params.amount : -debitTotal;
  }
  const tx: StoredTx = {
    id: `TXN_${Date.now().toString(36).toUpperCase()}`,
    userId: params.userId,
    kind: params.kind,
    amount: params.amount,
    fee,
    status,
    method: params.method,
    counterparty: params.counterparty,
    note: params.note,
    createdAt: new Date().toISOString(),
    rail: params.rail,
    railRef: params.railRef,
    meta: params.meta,
  };
  db.transactions.unshift(tx);
  await saveDb(db);
  if (status !== "pending") await emitPush((mod) => mod.pushForTransaction(tx));
  return { tx, balance: wallet.balance };
}

export function resetOtpKey(email: string) {
  return `reset:${normalizeOtpKey(email)}`;
}

export function pinResetOtpKey(email: string) {
  return `pinreset:${normalizeOtpKey(email)}`;
}

export function adminOtpKey(email: string) {
  return `admin:${normalizeOtpKey(email)}`;
}

function normalizeOtpKey(email: string) {
  return email.trim().toLowerCase();
}

export async function saveOtp(otp: StoredOtp) {
  const email = normalizeOtpKey(otp.email);
  const db = await getDb();
  db.otps = db.otps.filter((item) => normalizeOtpKey(item.email) !== email && item.exp > Date.now());
  db.otps.push({ ...otp, email });
  await saveDb(db);
}

export async function takeOtp(email: string) {
  const key = normalizeOtpKey(email);
  const db = await getDb();
  return db.otps.find((item) => normalizeOtpKey(item.email) === key) ?? null;
}

export async function bumpOtpAttempt(email: string) {
  const key = normalizeOtpKey(email);
  const db = await getDb();
  const otp = db.otps.find((item) => normalizeOtpKey(item.email) === key);
  if (otp) otp.attempts += 1;
  await saveDb(db);
  return otp;
}

export async function clearOtp(email: string) {
  const key = normalizeOtpKey(email);
  const db = await getDb();
  db.otps = db.otps.filter((item) => normalizeOtpKey(item.email) !== key);
  await saveDb(db);
}

export async function settleRailTx(railRef: string, status: TransactionStatus) {
  const db = await getDb();
  const tx = db.transactions.find((item) => item.railRef === railRef);
  if (!tx) return { ok: false as const, reason: "not_found" };
  if (tx.status === "success" || tx.status === "failed" || tx.status === "cancelled") {
    return { ok: true as const, noop: true, tx };
  }
  const wallet = db.wallets.find((item) => item.userId === tx.userId);
  if (!wallet) throw new Error("Wallet missing");
  const isCredit = tx.kind === "deposit" || tx.kind === "receive" || tx.kind === "collection";
  if (status === "success") {
    if (isCredit && tx.status === "pending") wallet.balance += tx.amount;
    tx.status = "success";
    if (tx.kind === "collection" && tx.meta?.linkSlug) {
      const link = db.links.find((item) => item.slug === tx.meta?.linkSlug);
      if (link) {
        link.collected += tx.amount;
        link.payments += 1;
      }
    }
  } else {
    if (!isCredit && tx.status === "pending") wallet.balance += tx.amount + (tx.fee || 0);
    tx.status = status === "cancelled" ? "cancelled" : "failed";
  }
  await saveDb(db);
  await emitPush((mod) => mod.pushForTransaction(tx));
  return { ok: true as const, tx, balance: wallet.balance };
}

export async function listAllTx() {
  const db = await getDb();
  return [...db.transactions].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function findTxById(id: string) {
  const db = await getDb();
  return db.transactions.find((tx) => tx.id === id) ?? null;
}

export async function findTxByRailRef(railRef: string) {
  const db = await getDb();
  return db.transactions.find((tx) => tx.railRef === railRef) ?? null;
}

export async function patchTx(id: string, patch: Partial<StoredTx>) {
  const db = await getDb();
  const tx = db.transactions.find((item) => item.id === id);
  if (!tx) throw new Error("Transaction not found");
  Object.assign(tx, patch);
  await saveDb(db);
  return tx;
}

export async function writeAudit(entry: Omit<AuditEntry, "id" | "createdAt"> & { id?: string }) {
  const db = await getDb();
  const row: AuditEntry = {
    id: entry.id || uid("aud"),
    actorId: entry.actorId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    note: entry.note,
    meta: entry.meta,
    createdAt: new Date().toISOString(),
  };
  db.audit.unshift(row);
  await saveDb(db);
  return row;
}

export async function listAudit() {
  const db = await getDb();
  return db.audit;
}

export async function listKyc(status?: KycApplication["status"]) {
  const db = await getDb();
  return status ? db.kyc.filter((item) => item.status === status) : db.kyc;
}

export async function listKycForUser(userId: string) {
  const db = await getDb();
  return db.kyc.filter((item) => item.userId === userId);
}

export async function createKyc(app: Omit<KycApplication, "id" | "createdAt" | "status"> & { status?: KycApplication["status"] }) {
  const db = await getDb();
  const row: KycApplication = {
    ...app,
    id: uid("kyc"),
    status: app.status ?? "pending",
    createdAt: new Date().toISOString(),
  };
  db.kyc.unshift(row);
  await saveDb(db);
  return row;
}

export async function saveKyc(app: KycApplication) {
  const db = await getDb();
  const idx = db.kyc.findIndex((item) => item.id === app.id);
  if (idx >= 0) db.kyc[idx] = app;
  else db.kyc.unshift(app);
  await saveDb(db);
  return app;
}

export async function findKycById(id: string) {
  const db = await getDb();
  return db.kyc.find((item) => item.id === id) ?? null;
}

export async function listKeys(userId: string) {
  const db = await getDb();
  return db.keys.filter((item) => item.userId === userId && !item.revokedAt);
}

export async function addApiKey(key: StoredApiKey) {
  const db = await getDb();
  db.keys.unshift(key);
  await saveDb(db);
  return key;
}

export async function revokeApiKey(id: string, userId: string) {
  const db = await getDb();
  const key = db.keys.find((item) => item.id === id && item.userId === userId);
  if (key) key.revokedAt = new Date().toISOString();
  await saveDb(db);
  return key ?? null;
}

export async function findKeyBySecret(secret: string) {
  const db = await getDb();
  for (const key of db.keys) {
    if (key.revokedAt) continue;
    if (await verifySecret(secret, key.secretHash)) return key;
  }
  return null;
}

function normalizeStoredLink(link: StoredLink): StoredLink {
  const imageUrl = typeof link.imageUrl === "string" ? link.imageUrl.trim() : "";
  return {
    ...link,
    template: normalizeLinkTemplate(link.template),
    imageUrl: imageUrl.startsWith("https://") ? imageUrl : undefined,
  };
}

export async function addLink(link: StoredLink) {
  const db = await getDb();
  const stored = normalizeStoredLink(link);
  db.links.unshift(stored);
  await saveDb(db);
  return stored;
}

export async function listLinks(userId: string) {
  const db = await getDb();
  return db.links.filter((item) => item.userId === userId).map(normalizeStoredLink);
}

export async function findLinkBySlug(slug: string) {
  const db = await getDb();
  const link = db.links.find((item) => item.slug === slug) ?? null;
  return link ? normalizeStoredLink(link) : null;
}

export async function findLinkByIdOrSlug(value: string) {
  const db = await getDb();
  const link = db.links.find((item) => item.id === value || item.slug === value) ?? null;
  return link ? normalizeStoredLink(link) : null;
}

export async function recordLinkPayment(slug: string | undefined, amount: number) {
  if (!slug || !amount) return;
  const db = await getDb();
  const link = db.links.find((item) => item.slug === slug);
  if (!link) return;
  link.collected += amount;
  link.payments += 1;
  await saveDb(db);
}

export async function listWebhooks(userId: string) {
  const db = await getDb();
  return db.webhooks.filter((item) => item.userId === userId);
}

export async function addWebhook(hook: StoredWebhook) {
  const db = await getDb();
  db.webhooks.unshift(hook);
  await saveDb(db);
  return hook;
}

export async function addLog(log: StoredLog) {
  const db = await getDb();
  db.logs.unshift(log);
  db.logs = db.logs.slice(0, 400);
  await saveDb(db);
  return log;
}

export async function listLogs(userId: string) {
  const db = await getDb();
  return db.logs.filter((item) => item.userId === userId);
}

export async function grantRole(user: StoredUser, role: AccountKind) {
  if (!user.roles.includes(role)) user.roles.push(role);
  return upsertUser(user);
}

export async function revokeRole(user: StoredUser, role: AccountKind) {
  if (role === "personal") return user;
  user.roles = user.roles.filter((item) => item !== role);
  return upsertUser(user);
}

export function publicUser(user: StoredUser) {
  const normalized = normalizeUser(user);
  return {
    id: normalized.id,
    name: normalized.name,
    lbpayId: normalized.lbpayId,
    email: normalized.email,
    phone: normalized.phone,
    avatar: normalized.avatar,
    kycStatus: normalized.kyc.personal,
    emailVerified: normalized.emailVerified,
    pinSet: Boolean(normalized.pinHash),
    roles: normalized.roles,
    status: normalized.status,
    kyc: normalized.kyc,
    businessName: normalized.businessName || "",
  };
}

export async function getVapidKeys() {
  const db = await getDb();
  if (db.vapid?.publicKey && db.vapid?.privateKey) return db.vapid;
  return null;
}

export async function saveVapidKeys(keys: { publicKey: string; privateKey: string }) {
  const db = await getDb();
  db.vapid = keys;
  await saveDb(db);
  return keys;
}

async function emitPush(run: (mod: typeof import("./push")) => Promise<unknown>) {
  try {
    const mod = await import("./push");
    await run(mod);
  } catch (error) {
    console.error("[lbpay] push failed", error);
  }
}

export async function savePushSubscription(row: StoredPushSubscription) {
  const db = await getDb();
  db.pushSubscriptions = (db.pushSubscriptions || []).filter((item) => item.endpoint !== row.endpoint);
  const existing = db.pushSubscriptions.filter((item) => item.userId === row.userId);
  if (existing.length >= 8) {
    const drop = existing
      .slice()
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
      .slice(0, existing.length - 7);
    const dropEnds = new Set(drop.map((item) => item.endpoint));
    db.pushSubscriptions = db.pushSubscriptions.filter((item) => !dropEnds.has(item.endpoint));
  }
  db.pushSubscriptions.push(row);
  await saveDb(db);
}

export async function listPushSubscriptions(userId: string) {
  const db = await getDb();
  return (db.pushSubscriptions || []).filter((item) => item.userId === userId);
}

export async function deletePushSubscription(userId: string, endpoint?: string) {
  const db = await getDb();
  db.pushSubscriptions = (db.pushSubscriptions || []).filter((item) => {
    if (item.userId !== userId) return true;
    if (!endpoint) return false;
    return item.endpoint !== endpoint;
  });
  await saveDb(db);
}

export async function removePushEndpoint(endpoint: string) {
  const db = await getDb();
  db.pushSubscriptions = (db.pushSubscriptions || []).filter((item) => item.endpoint !== endpoint);
  await saveDb(db);
}

