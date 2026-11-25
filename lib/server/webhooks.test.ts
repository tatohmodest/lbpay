import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildEventForTx,
  formatApiPayment,
  signWebhookPayload,
  validateWebhookUrl,
  verifyWebhookSignature,
} from "./webhooks";
import type { StoredTx } from "./db";

test("validateWebhookUrl accepts public HTTPS endpoints and blocks SSRF targets", () => {
  const ok = validateWebhookUrl("https://fabioom.com/api/public/lbpay-webhook", { allowLocal: false });
  assert.equal(ok.ok, true);

  assert.equal(validateWebhookUrl("http://fabioom.com/webhook", { allowLocal: false }).ok, false);
  assert.equal(validateWebhookUrl("https://169.254.169.254/latest/meta-data", { allowLocal: false }).ok, false);
  assert.equal(validateWebhookUrl("https://10.0.0.5/hook", { allowLocal: false }).ok, false);
  assert.equal(validateWebhookUrl("https://192.168.1.20/hook", { allowLocal: false }).ok, false);
  assert.equal(validateWebhookUrl("https://127.0.0.1:4000/hook", { allowLocal: false }).ok, false);
  assert.equal(
    validateWebhookUrl("https://example.com/api/v1/webhooks/payunit", { allowLocal: false }).ok,
    false,
  );
  assert.equal(validateWebhookUrl("http://localhost:4000/hook", { allowLocal: true }).ok, true);
});

test("HMAC webhook signature signs and verifies payloads", () => {
  const secret = "whsec_test_secret_123456";
  const rawBody = JSON.stringify({ id: "evt_1", type: "payment.succeeded" });
  const ts = 1_764_000_000;
  const header = signWebhookPayload(rawBody, secret, ts);

  assert.equal(verifyWebhookSignature(rawBody, header, secret, 300, ts + 10), true);
  assert.equal(verifyWebhookSignature(`${rawBody} `, header, secret, 300, ts + 10), false);
  assert.equal(verifyWebhookSignature(rawBody, header, "whsec_wrong", 300, ts + 10), false);
  assert.equal(verifyWebhookSignature(rawBody, header, secret, 300, ts + 600), false);
});

test("buildEventForTx formats checkout and API collections accurately", () => {
  const checkoutTx: StoredTx = {
    id: "TXN_t60oaw75ox",
    userId: "u_merchant",
    kind: "collection",
    amount: 100,
    fee: 2,
    status: "success",
    method: "mtn",
    counterparty: "MTN 670112233",
    note: "QR pay · @fabioom",
    createdAt: "2026-11-25T11:00:00.000Z",
    rail: "payunit",
    railRef: "MT12345678AB",
    meta: { source: "checkout", handle: "fabioom", from: "670112233" },
  };

  const evt = buildEventForTx(checkoutTx, "live");
  assert.ok(evt);
  assert.equal(evt.type, "payment.succeeded");
  assert.equal(evt.data.object, "payment");
  if (evt.data.object === "payment") {
    assert.equal(evt.data.id, "TXN_t60oaw75ox");
    assert.equal(evt.data.amount, 100);
    assert.equal(evt.data.net, 100);
    assert.equal(evt.data.fee, 2);
    assert.equal(evt.data.customer.phone, "670112233");
  }

  const apiTx: StoredTx = {
    id: "TXN_MW4E36KD",
    userId: "u_merchant",
    kind: "collection",
    amount: 975,
    fee: 25,
    status: "success",
    method: "mtn",
    counterparty: "670112233",
    note: "API collection",
    createdAt: "2026-11-06T10:00:00.000Z",
    rail: "payunit",
    railRef: "PAY998877",
    meta: { source: "api", grossAmount: 1000, customerPhone: "670112233" },
  };
  const apiFormatted = formatApiPayment(apiTx, "live");
  assert.equal(apiFormatted.amount, 1000);
  assert.equal(apiFormatted.fee, 25);
  assert.equal(apiFormatted.net, 975);

  const pendingTx: StoredTx = { ...checkoutTx, status: "pending" };
  assert.equal(buildEventForTx(pendingTx, "live"), null);

  const personalDeposit: StoredTx = { ...checkoutTx, kind: "deposit" };
  assert.equal(buildEventForTx(personalDeposit, "live"), null);
});
