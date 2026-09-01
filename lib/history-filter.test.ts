import assert from "node:assert/strict";
import { test } from "node:test";
import type { Transaction } from "./types";
import {
  csvCell,
  filterHistory,
  historyToCsv,
  statementFilename,
} from "./history-filter";

const now = Date.parse("2026-09-01T12:00:00.000Z");

function tx(partial: Partial<Transaction> & Pick<Transaction, "id" | "kind" | "counterparty">): Transaction {
  return {
    amount: 1000,
    fee: 0,
    status: "success",
    method: "wallet",
    createdAt: "2026-09-01T10:00:00.000Z",
    ...partial,
  };
}

const ledger: Transaction[] = [
  tx({ id: "tx_out", kind: "send", counterparty: "Amina T.", amount: 2500, fee: 75 }),
  tx({
    id: "tx_in",
    kind: "receive",
    counterparty: "Jean M.",
    amount: 8000,
    method: "mtn",
    createdAt: "2026-08-20T10:00:00.000Z",
  }),
  tx({
    id: "tx_pending",
    kind: "deposit",
    counterparty: "MTN MoMo",
    status: "pending",
    method: "mtn",
    createdAt: "2026-08-01T10:00:00.000Z",
  }),
  tx({
    id: "tx_failed",
    kind: "withdraw",
    counterparty: "Orange Money",
    status: "cancelled",
    method: "orange",
    createdAt: "2026-07-01T10:00:00.000Z",
  }),
];

test("direction keeps money in or out", () => {
  assert.deepEqual(
    filterHistory(ledger, { direction: "out" }).map((item) => item.id),
    ["tx_out", "tx_failed"],
  );
  assert.deepEqual(
    filterHistory(ledger, { direction: "in" }).map((item) => item.id),
    ["tx_in", "tx_pending"],
  );
});

test("failed status includes cancelled payments", () => {
  assert.deepEqual(
    filterHistory(ledger, { status: "failed" }).map((item) => item.id),
    ["tx_failed"],
  );
});

test("period drops older rows", () => {
  assert.deepEqual(
    filterHistory(ledger, { period: "7d", now }).map((item) => item.id),
    ["tx_out"],
  );
  assert.deepEqual(
    filterHistory(ledger, { period: "30d", now }).map((item) => item.id),
    ["tx_out", "tx_in"],
  );
});

test("search matches name, id, or kind", () => {
  assert.equal(filterHistory(ledger, { q: "amina" })[0]?.id, "tx_out");
  assert.equal(filterHistory(ledger, { q: "tx_in" })[0]?.id, "tx_in");
  assert.equal(filterHistory(ledger, { q: "withdraw" })[0]?.id, "tx_failed");
});

test("statement csv is spreadsheet-friendly and escapes quotes", () => {
  const row = tx({
    id: "tx_quote",
    kind: "send",
    counterparty: 'Shop "Central"',
    amount: 1200,
    fee: 36,
  });
  const csv = historyToCsv([row]);
  assert.match(csv, /^Date,ID,Kind,Direction,Counterparty,Method,Amount,Fee,Status\n/);
  assert.match(csv, /"Shop ""Central"""/);
  assert.match(csv, /,-1200,36,success\n$/);
  assert.equal(csvCell('Shop "Central"'), '"Shop ""Central"""');
});

test("statement filename uses the calendar day", () => {
  assert.equal(statementFilename(new Date("2026-09-01T23:15:00.000Z")), "lbpay-statement-2026-09-01.csv");
});
