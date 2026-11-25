import { createHmac, timingSafeEqual } from "crypto";
import { uid } from "@/lib/format";
import {
  issueWebhookSecret,
  listWebhooks,
  patchTx,
  recordWebhookDelivery,
  type StoredTx,
  type StoredWebhook,
  type StoredWebhookDelivery,
} from "@/lib/server/db";
import type { WebhookEventType } from "@/lib/types";

export const WEBHOOK_EVENTS = [
  "payment.succeeded",
  "payment.failed",
  "payout.succeeded",
  "payout.failed",
] as const;

export type ApiPaymentObject = {
  id: string;
  object: "payment";
  amount: number;
  fee: number;
  net: number;
  currency: "XAF";
  status: "pending" | "success" | "failed";
  method: string;
  reference: string;
  rail: string;
  environment: "live" | "sandbox";
  description: string | null;
  linkSlug: string | null;
  customer: {
    phone?: string;
    name?: string;
    email?: string;
  };
  createdAt: string;
};

export type ApiPayoutObject = {
  id: string;
  object: "payout";
  amount: number;
  fee: number;
  currency: "XAF";
  phone: string;
  network: "mtn" | "orange";
  status: "pending" | "success" | "failed";
  reference: string;
  rail: string;
  environment: "live" | "sandbox";
  createdAt: string;
};

export type WebhookEventPayload = {
  id: string;
  object: "event";
  type: WebhookEventType;
  createdAt: string;
  environment: "live" | "sandbox";
  data: ApiPaymentObject | ApiPayoutObject;
};

const WEBHOOK_TIMEOUT_MS = 8_000;
const RETRY_DELAY_MS = 1_200;

function isPrivateIpv4(host: string) {
  const match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const parts = match.slice(1).map(Number);
  if (parts.some((n) => n > 255)) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isPrivateHost(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, "").trim().toLowerCase();
  if (!host) return true;
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "::1" ||
    host === "0:0:0:0:0:0:0:1" ||
    host.startsWith("fc") ||
    host.startsWith("fd") ||
    host.startsWith("fe80:")
  ) {
    return true;
  }
  return isPrivateIpv4(host);
}

function ownSiteHost() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "";
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Validates that a merchant webhook URL is safe to call from the server (SSRF protection).
 * Requires HTTPS in production; allows HTTP on localhost during local development.
 */
export function validateWebhookUrl(
  rawUrl: string,
  options: { allowLocal?: boolean } = {},
): { ok: true; url: string } | { ok: false; error: string } {
  const allowLocal = options.allowLocal ?? process.env.NODE_ENV !== "production";
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) return { ok: false, error: "Enter a webhook URL." };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "Enter a valid webhook URL." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, error: "Webhook URL must use HTTPS." };
  }

  const host = parsed.hostname.toLowerCase();
  const isLocal = host === "localhost" || host === "127.0.0.1";

  if (parsed.protocol === "http:" && !(allowLocal && isLocal)) {
    return { ok: false, error: "Webhook URL must start with https://." };
  }

  if (isPrivateHost(host) && !(allowLocal && isLocal)) {
    return { ok: false, error: "Webhook URL must point to a public internet host." };
  }

  if (parsed.pathname.startsWith("/api/v1/webhooks/payunit")) {
    return { ok: false, error: "Cannot register LBPay's own gateway callback URL." };
  }

  const selfHost = ownSiteHost();
  if (selfHost && selfHost !== "localhost" && host === selfHost) {
    return { ok: false, error: "Webhook URL must point to your own server, not LBPay." };
  }

  return { ok: true, url: parsed.toString() };
}

export function normalizeWebhookEvents(input?: unknown): string[] {
  if (!Array.isArray(input) || !input.length) {
    return [...WEBHOOK_EVENTS];
  }
  const allowed = new Set<string>([...WEBHOOK_EVENTS, "*"]);
  const picked = input
    .map((item) => String(item || "").trim())
    .filter((item) => allowed.has(item));
  return picked.length ? [...new Set(picked)] : [...WEBHOOK_EVENTS];
}

export function signWebhookPayload(
  payload: string,
  secret: string,
  timestampSeconds = Math.floor(Date.now() / 1000),
) {
  const signedPayload = `${timestampSeconds}.${payload}`;
  const digest = createHmac("sha256", secret).update(signedPayload).digest("hex");
  return `t=${timestampSeconds},v1=${digest}`;
}

export function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!signatureHeader || !secret) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((pair) => {
      const idx = pair.indexOf("=");
      return idx > 0 ? [pair.slice(0, idx).trim(), pair.slice(idx + 1).trim()] : ["", ""];
    }),
  );
  const ts = Number(parts.t);
  const v1 = parts.v1 || "";
  if (!Number.isFinite(ts) || !v1) return false;
  if (toleranceSeconds > 0 && Math.abs(nowSeconds - ts) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret).update(`${ts}.${payload}`).digest("hex");
  const a = Buffer.from(v1);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function normalizeApiStatus(status: string): "pending" | "success" | "failed" {
  if (status === "success") return "success";
  if (status === "pending") return "pending";
  return "failed";
}

function isApiOriginatedCollection(tx: StoredTx): boolean {
  if (tx.meta?.source === "api") return true;
  if (tx.meta?.source === "checkout" || tx.meta?.handle || tx.meta?.linkSlug) return false;
  return tx.note === "API collection" || Boolean(tx.railRef?.startsWith("PAY"));
}

export function formatApiPayment(tx: StoredTx, env: "live" | "sandbox" = "live"): ApiPaymentObject {
  const fee = Math.max(0, Math.round(tx.fee || 0));
  const apiSource = isApiOriginatedCollection(tx);
  // API collections deduct the 2.5% fee from what lands in the merchant wallet (tx.amount = gross - fee).
  // Hosted checkout / payment-link collections charge the fee on top to the payer, so merchant net === tx.amount.
  const net = tx.amount;
  const amount = apiSource ? (tx.meta?.grossAmount ?? tx.amount + fee) : tx.amount;

  const phone =
    tx.meta?.customerPhone ||
    tx.meta?.from ||
    (/\d{8,}/.test(tx.counterparty || "") ? tx.counterparty.replace(/^(MTN|Orange)\s+/i, "") : undefined);

  const customer: ApiPaymentObject["customer"] = {};
  if (phone) customer.phone = phone;
  if (tx.meta?.customerName) customer.name = tx.meta.customerName;
  if (tx.meta?.customerEmail) customer.email = tx.meta.customerEmail;

  return {
    id: tx.id,
    object: "payment",
    amount,
    fee,
    net,
    currency: "XAF",
    status: normalizeApiStatus(tx.status),
    method: tx.method,
    reference: tx.railRef || tx.id,
    rail: tx.rail || "payunit",
    environment: tx.rail === "sandbox" ? "sandbox" : env,
    description: tx.note || null,
    linkSlug: tx.meta?.linkSlug || null,
    customer,
    createdAt: tx.createdAt,
  };
}

export function formatApiPayout(tx: StoredTx, env: "live" | "sandbox" = "live"): ApiPayoutObject {
  return {
    id: tx.id,
    object: "payout",
    amount: tx.amount,
    fee: Math.max(0, Math.round(tx.fee || 0)),
    currency: "XAF",
    phone: tx.meta?.to || tx.counterparty,
    network: tx.method === "orange" ? "orange" : "mtn",
    status: normalizeApiStatus(tx.status),
    reference: tx.railRef || tx.id,
    rail: tx.rail || "payunit",
    environment: tx.rail === "sandbox" ? "sandbox" : env,
    createdAt: tx.createdAt,
  };
}

export function eventTypeForTx(tx: StoredTx): WebhookEventType | null {
  const status = normalizeApiStatus(tx.status);
  if (status === "pending") return null;

  const isCollection =
    tx.kind === "collection" ||
    (tx.kind === "receive" && Boolean(tx.meta?.handle || tx.meta?.linkSlug));

  if (isCollection) {
    return status === "success" ? "payment.succeeded" : "payment.failed";
  }
  if (tx.kind === "payout") {
    return status === "success" ? "payout.succeeded" : "payout.failed";
  }
  return null;
}

export function buildEventForTx(
  tx: StoredTx,
  env: "live" | "sandbox" = "live",
): WebhookEventPayload | null {
  const type = eventTypeForTx(tx);
  if (!type) return null;
  const environment = tx.rail === "sandbox" ? "sandbox" : env;
  const data =
    tx.kind === "payout"
      ? formatApiPayout(tx, environment)
      : formatApiPayment(tx, environment);

  return {
    id: `evt_${tx.id}_${type.replace(".", "_")}`,
    object: "event",
    type,
    createdAt: new Date().toISOString(),
    environment,
    data,
  };
}

function hookSubscribesTo(hook: StoredWebhook, eventType: WebhookEventType): boolean {
  if (hook.status !== "active") return false;
  if (eventType === "webhook.test") return true;
  const events = hook.events || [];
  return events.includes("*") || events.includes(eventType);
}

async function postOnce(
  url: string,
  body: string,
  headers: Record<string, string>,
): Promise<{ status: number; ok: boolean; durationMs: number; responsePreview?: string; error?: string }> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      redirect: "error",
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });
    const text = await res.text().catch(() => "");
    return {
      status: res.status,
      ok: res.ok,
      durationMs: Date.now() - started,
      responsePreview: text.slice(0, 180) || undefined,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      status: 0,
      ok: false,
      durationMs: Date.now() - started,
      error: err instanceof Error ? err.message.slice(0, 160) : "Request failed",
    };
  }
}

export async function deliverWebhookToEndpoint(
  hook: StoredWebhook,
  event: WebhookEventPayload,
  txId?: string,
): Promise<StoredWebhookDelivery> {
  const deliveryId = uid("whd");
  const check = validateWebhookUrl(hook.url);
  if (!check.ok) {
    const blocked: StoredWebhookDelivery = {
      id: deliveryId,
      webhookId: hook.id,
      userId: hook.userId,
      url: hook.url,
      event: event.type,
      txId,
      status: 0,
      ok: false,
      durationMs: 0,
      error: check.error,
      createdAt: new Date().toISOString(),
    };
    await recordWebhookDelivery(blocked).catch(() => null);
    return blocked;
  }

  const secret = hook.secret || issueWebhookSecret();
  const body = JSON.stringify(event);
  const ts = Math.floor(Date.now() / 1000);
  const signature = signWebhookPayload(body, secret, ts);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "LBPay-Webhook/1.0",
    "X-LBPay-Event": event.type,
    "X-LBPay-Event-Id": event.id,
    "X-LBPay-Delivery-Id": deliveryId,
    "X-LBPay-Timestamp": String(ts),
    "X-LBPay-Signature": signature,
  };

  let attempt = await postOnce(check.url, body, headers);
  if (!attempt.ok && (attempt.status === 0 || attempt.status >= 500 || attempt.status === 429)) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    const retryTs = Math.floor(Date.now() / 1000);
    const retryHeaders = {
      ...headers,
      "X-LBPay-Timestamp": String(retryTs),
      "X-LBPay-Signature": signWebhookPayload(body, secret, retryTs),
    };
    attempt = await postOnce(check.url, body, retryHeaders);
  }

  const delivery: StoredWebhookDelivery = {
    id: deliveryId,
    webhookId: hook.id,
    userId: hook.userId,
    url: hook.url,
    event: event.type,
    txId,
    status: attempt.status,
    ok: attempt.ok,
    durationMs: attempt.durationMs,
    error: attempt.error,
    responsePreview: attempt.responsePreview,
    createdAt: new Date().toISOString(),
  };
  await recordWebhookDelivery(delivery).catch(() => null);
  return delivery;
}

export async function dispatchWebhooksForTx(
  tx: StoredTx,
  options: { force?: boolean; env?: "live" | "sandbox" } = {},
) {
  const event = buildEventForTx(tx, options.env || "live");
  if (!event) {
    return { eventType: null, matched: 0, sent: 0, deliveries: [] as StoredWebhookDelivery[] };
  }

  if (!options.force && tx.meta?.webhookDeliveredAt) {
    return { eventType: event.type, matched: 0, sent: 0, deliveries: [] as StoredWebhookDelivery[], skipped: true };
  }

  const hooks = (await listWebhooks(tx.userId)).filter((hook) => hookSubscribesTo(hook, event.type));
  if (!hooks.length) {
    return { eventType: event.type, matched: 0, sent: 0, deliveries: [] as StoredWebhookDelivery[] };
  }

  const deliveries = await Promise.all(
    hooks.map((hook) => deliverWebhookToEndpoint(hook, event, tx.id)),
  );
  const sent = deliveries.filter((d) => d.ok).length;

  if (sent > 0 && tx.id && !tx.id.startsWith("sbx_")) {
    await patchTx(tx.id, {
      meta: { ...tx.meta, webhookDeliveredAt: new Date().toISOString() },
    }).catch(() => null);
  }

  return { eventType: event.type, matched: hooks.length, sent, deliveries };
}

export async function sendTestWebhook(hook: StoredWebhook): Promise<StoredWebhookDelivery> {
  const now = new Date().toISOString();
  const sampleId = uid("sbx_test");
  const event: WebhookEventPayload = {
    id: uid("evt"),
    object: "event",
    type: "webhook.test",
    createdAt: now,
    environment: "sandbox",
    data: {
      id: sampleId,
      object: "payment",
      amount: 100,
      fee: 2,
      net: 98,
      currency: "XAF",
      status: "success",
      method: "mtn",
      reference: sampleId,
      rail: "sandbox",
      environment: "sandbox",
      description: "LBPay webhook test event",
      linkSlug: null,
      customer: { phone: "670000000" },
      createdAt: now,
    },
  };
  return deliverWebhookToEndpoint(hook, event, sampleId);
}
