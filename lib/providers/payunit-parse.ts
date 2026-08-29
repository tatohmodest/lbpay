import { cameroonMsisdn, isCameroonMsisdn } from "../phone";
import type { RailResult } from "./types";

export function railStatus(raw: string | undefined): RailResult["status"] {
  const value = String(raw || "").toUpperCase();
  if (["SUCCESS", "SUCCESSFUL", "SUCCESSFULL", "PAID", "CONFIRMED", "APPROVED"].includes(value)) {
    return "success";
  }
  if (["FAILED", "CANCELLED", "CANCELED", "ERROR", "REJECTED", "DECLINED"].includes(value)) {
    return "failed";
  }
  return "pending";
}

export function disbursementAccount(phone: string) {
  const local = cameroonMsisdn(phone);
  if (isCameroonMsisdn(local)) return `237${local}`;
  return "";
}

export function sanitizeDisburseText(raw: string | undefined, fallback: string, max = 80) {
  const cleaned = String(raw || "")
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || fallback).slice(0, max);
}

export function pickPayToken(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const row = payload as Record<string, unknown>;
  const nested =
    row.data && typeof row.data === "object" && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : {};
  return String(
    row.pay_token ||
      row.payToken ||
      nested.pay_token ||
      nested.payToken ||
      row.deposit_reference_token ||
      nested.deposit_reference_token ||
      "",
  ).trim();
}

export function pickTransactionId(payload: unknown, fallback = "") {
  if (!payload || typeof payload !== "object") return fallback;
  const row = payload as Record<string, unknown>;
  const nested =
    row.data && typeof row.data === "object" && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : {};
  return String(
    row.transaction_id ||
      row.transactionId ||
      nested.transaction_id ||
      nested.transactionId ||
      row.reference ||
      nested.reference ||
      fallback,
  ).trim();
}

export function pickStatusRaw(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const row = payload as Record<string, unknown>;
  const nested =
    row.data && typeof row.data === "object" && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : {};
  return String(
    nested.transaction_status ||
      nested.payment_status ||
      nested.deposit_status ||
      row.transaction_status ||
      row.payment_status ||
      row.deposit_status ||
      nested.status ||
      "",
  ).trim();
}

/** PayUnit notify payloads nest the real transaction under `data`. */
export function unwrapPayunitNotify(payload: Record<string, unknown>) {
  const nested =
    payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)
      ? (payload.data as Record<string, unknown>)
      : {};
  const merged = { ...payload, ...nested };
  const reference = String(
    merged.transaction_id ||
      merged.transactionId ||
      merged.reference ||
      merged.pay_token ||
      merged.payToken ||
      "",
  ).trim();
  const rawStatus = pickStatusRaw(payload);
  return { reference, rawStatus, merged, payToken: pickPayToken(payload) };
}

export function unwrapPayunitBody(payload: unknown) {
  if (!payload || typeof payload !== "object") return {};
  const row = payload as Record<string, unknown>;
  if (row.data && typeof row.data === "object" && !Array.isArray(row.data)) {
    return row.data as Record<string, unknown>;
  }
  return row;
}

export function isTimeoutError(error: unknown) {
  const text = error instanceof Error ? error.message : String(error || "");
  return /timeout|timed out|etimedout|econnaborted/i.test(text);
}
