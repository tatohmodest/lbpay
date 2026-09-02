import assert from "node:assert/strict";
import { test } from "node:test";
import { kindTitle, publicTx, receiptText, statusLabel, txHref } from "./tx";

test("publicTx drops pay tokens and keeps useful meta", () => {
  const tx = publicTx({
    id: "tx_1",
    kind: "cross_network",
    amount: 5000,
    fee: 100,
    status: "success",
    method: "mtn",
    counterparty: "Orange Money",
    createdAt: "2026-09-01T10:00:00.000Z",
    meta: { fromNetwork: "mtn", toNetwork: "orange", payToken: "secret", linkSlug: "oil" },
  });
  assert.equal(tx.meta?.fromNetwork, "mtn");
  assert.equal(tx.meta?.linkSlug, "oil");
  assert.equal((tx.meta as { payToken?: string } | undefined)?.payToken, undefined);
});

test("labels and receipt stay readable", () => {
  assert.equal(kindTitle("cross_network"), "Quick transfer");
  assert.equal(statusLabel("success"), "Paid");
  assert.equal(txHref("tx_1"), "/wallet/history/tx_1");
  const text = receiptText({
    id: "tx_1",
    kind: "receive",
    amount: 8000,
    fee: 0,
    status: "success",
    method: "wallet",
    counterparty: "@paul",
    createdAt: "2026-09-01T10:00:00.000Z",
  });
  assert.match(text, /Paid/);
  assert.match(text, /8\s?000/);
  assert.match(text, /@paul/);
});
