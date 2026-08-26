import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { hashSecret } from "./crypto";
import type { PaymentMethod, Transaction, TransactionKind, TransactionStatus } from "@/lib/types";

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
  kycStatus: "unverified" | "pending" | "verified";
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

type DbShape = {
  users: StoredUser[];
  otps: StoredOtp[];
  wallets: StoredWallet[];
  transactions: StoredTx[];
};

const FILE = path.join(process.cwd(), "data", "lbpay.json");

let cache: DbShape | null = null;
let seeding: Promise<void> | null = null;

async function empty(): Promise<DbShape> {
  return { users: [], otps: [], wallets: [], transactions: [] };
}

async function seedIfNeeded(db: DbShape) {
  if (db.users.length) return db;
  const passwordHash = await hashSecret("demo123");
  const pinHash = await hashSecret("1234");
  const users: StoredUser[] = [
    {
      id: "usr_modest",
      name: "Modest Tatoh",
      lbpayId: "modest",
      email: "modest@lbpay.cm",
      phone: "670112233",
      avatar: "/illustrations/avatar-modest.png",
      passwordHash,
      pinHash,
      emailVerified: true,
      kycStatus: "verified",
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr_kossi",
      name: "Kossi Mensah",
      lbpayId: "kossi",
      email: "kossi@lbpay.cm",
      phone: "650987654",
      avatar: "/illustrations/empty-wallet.png",
      passwordHash,
      pinHash,
      emailVerified: true,
      kycStatus: "verified",
      createdAt: new Date().toISOString(),
    },
    {
      id: "usr_marie",
      name: "Marie Kamga",
      lbpayId: "marie",
      email: "marie@lbpay.cm",
      phone: "677445566",
      avatar: "/illustrations/request-money.png",
      passwordHash,
      pinHash,
      emailVerified: true,
      kycStatus: "verified",
      createdAt: new Date().toISOString(),
    },
  ];
  db.users = users;
  db.wallets = [
    { userId: "usr_modest", balance: 125_500 },
    { userId: "usr_kossi", balance: 18_000 },
    { userId: "usr_marie", balance: 42_000 },
  ];
  const now = new Date().toISOString();
  db.transactions = [
    {
      id: "TXN_SEED_RECV",
      userId: "usr_modest",
      kind: "receive",
      amount: 45_000,
      fee: 0,
      status: "success",
      method: "wallet",
      counterparty: "@marie",
      counterpartyId: "usr_marie",
      note: "LBPay wallet transfer",
      createdAt: now,
      rail: "internal",
    },
    {
      id: "TXN_SEED_RECV_IN",
      userId: "usr_marie",
      kind: "send",
      amount: 45_000,
      fee: 0,
      status: "success",
      method: "wallet",
      counterparty: "@modest",
      counterpartyId: "usr_modest",
      note: "LBPay wallet transfer",
      createdAt: now,
      rail: "internal",
    },
  ];
  return db;
}

async function readDb(): Promise<DbShape> {
  if (cache) return cache;
  try {
    const raw = await readFile(FILE, "utf8");
    cache = JSON.parse(raw) as DbShape;
  } catch {
    cache = await empty();
  }
  cache = await seedIfNeeded(cache);
  await writeDb(cache);
  return cache;
}

async function writeDb(db: DbShape) {
  cache = db;
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(db, null, 2), "utf8");
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
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserByHandle(handle: string) {
  const db = await getDb();
  const id = handle.replace(/^@/, "").toLowerCase();
  return db.users.find((u) => u.lbpayId.toLowerCase() === id) ?? null;
}

export async function findUserById(id: string) {
  const db = await getDb();
  return db.users.find((u) => u.id === id) ?? null;
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

export function publicUser(user: StoredUser) {
  return {
    id: user.id,
    name: user.name,
    lbpayId: user.lbpayId,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    kycStatus: user.kycStatus,
    emailVerified: user.emailVerified,
    pinSet: Boolean(user.pinHash),
  };
}
