import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { verifySecret } from "./crypto";
import { isBootstrapAdmin } from "@/lib/roles";
import { uid } from "@/lib/format";
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
  };
}

async function readDb(): Promise<DbShape> {
  if (cache) return cache;
  for (const file of candidateFiles()) {
    try {
      const raw = await readFile(file, "utf8");
      cache = withCollections(JSON.parse(raw) as DbShape);
      filePath = file;
      return cache;
    } catch {
      /* try the next location */
    }
  }
  cache = await empty();
  try {
    await writeDb(cache);
  } catch (error) {
    console.error("[lbpay] could not initialize the data file", error);
  }
  return cache;
}

async function writeDb(db: DbShape) {
  cache = db;
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

export async function getDb() {
  if (!seeding) seeding = readDb().then(() => undefined);
  await seeding;
  return readDb();
}

export async function saveDb(db: DbShape) {
  await writeDb(db);
}

export async function findUserByEmail(email: string) {
  const db = await getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  return user ? normalizeUser(user) : null;
}

export async function findUserByHandle(handle: string) {
  const db = await getDb();
  const id = handle.replace(/^@/, "").toLowerCase();
  const user = db.users.find((u) => u.lbpayId.toLowerCase() === id) ?? null;
  return user ? normalizeUser(user) : null;
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
  const db = await getDb();
  const idx = db.users.findIndex((u) => u.id === user.id);
  if (idx >= 0) db.users[idx] = user;
  else db.users.push(user);
  if (!db.wallets.some((w) => w.userId === user.id)) {
    db.wallets.push({ userId: user.id, balance: 0 });
  }
  await saveDb(db);
  return user;
}

export async function getWallet(userId: string) {
  const db = await getDb();
  let wallet = db.wallets.find((w) => w.userId === userId);
  if (!wallet) {
    wallet = { userId, balance: 0 };
    db.wallets.push(wallet);
    await saveDb(db);
  }
  return wallet;
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
}) {
  const db = await getDb();
  const wallet = db.wallets.find((w) => w.userId === params.userId);
  if (!wallet) throw new Error("Wallet missing");
  const status = params.status ?? "success";
  const applyNow =
    params.direction === "debit" || (params.direction === "credit" && status === "success");
  if (params.direction === "debit" && wallet.balance < params.amount) {
    throw new Error("Insufficient wallet balance");
  }
  if (applyNow) {
    wallet.balance += params.direction === "credit" ? params.amount : -params.amount;
  }
  const tx: StoredTx = {
    id: `TXN_${Date.now().toString(36).toUpperCase()}`,
    userId: params.userId,
    kind: params.kind,
    amount: params.amount,
    fee: 0,
    status,
    method: params.method,
    counterparty: params.counterparty,
    note: params.note,
    createdAt: new Date().toISOString(),
    rail: params.rail,
    railRef: params.railRef,
  };
  db.transactions.unshift(tx);
  await saveDb(db);
  return { tx, balance: wallet.balance };
}

export async function saveOtp(otp: StoredOtp) {
  const db = await getDb();
  db.otps = db.otps.filter((item) => item.email !== otp.email && item.exp > Date.now());
  db.otps.push(otp);
  await saveDb(db);
}

export async function takeOtp(email: string) {
  const db = await getDb();
  const otp = db.otps.find((item) => item.email === email.toLowerCase());
  return otp ?? null;
}

export async function bumpOtpAttempt(email: string) {
  const db = await getDb();
  const otp = db.otps.find((item) => item.email === email.toLowerCase());
  if (otp) otp.attempts += 1;
  await saveDb(db);
  return otp;
}

export async function clearOtp(email: string) {
  const db = await getDb();
  db.otps = db.otps.filter((item) => item.email !== email.toLowerCase());
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
  } else {
    if (!isCredit && tx.status === "pending") wallet.balance += tx.amount;
    tx.status = status === "cancelled" ? "cancelled" : "failed";
  }
  await saveDb(db);
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

export async function addLink(link: StoredLink) {
  const db = await getDb();
  db.links.unshift(link);
  await saveDb(db);
  return link;
}

export async function listLinks(userId: string) {
  const db = await getDb();
  return db.links.filter((item) => item.userId === userId);
}

export async function findLinkBySlug(slug: string) {
  const db = await getDb();
  return db.links.find((item) => item.slug === slug) ?? null;
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
