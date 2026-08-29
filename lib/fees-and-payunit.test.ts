import assert from "node:assert/strict";
import { test } from "node:test";
import { depositFee, directTransferFee, FEE_RATES, momoOutFee } from "./fees";
import { amountIssue, LIMITS } from "./limits";
import {
  disbursementAccount,
  pickPayToken,
  railStatus,
  sanitizeDisburseText,
  unwrapPayunitNotify,
} from "./providers/payunit-parse";
import { parsePaymentLinkPatch } from "./server/payment-links";
import { payunitGatewayUrl } from "./site";
import { mapRailError } from "./public-error";

test("deposit is 2 percent and withdrawal is 3 percent", () => {
  assert.equal(FEE_RATES.deposit, 0.02);
  assert.equal(FEE_RATES.withdraw, 0.03);
  assert.equal(depositFee(10_000), 200);
  assert.equal(momoOutFee(10_000), 300);
  assert.equal(directTransferFee(10_000, "mtn", "mtn"), 300);
  assert.equal(directTransferFee(10_000, "mtn", "orange"), 600);
});

test("withdrawal minimum is 1000 XAF, not 100", () => {
  assert.equal(LIMITS.withdrawMin, 1000);
  assert.equal(LIMITS.depositMin, 100);
  assert.match(amountIssue(100, "withdraw"), /1[\s\u00a0]?000/);
  assert.equal(amountIssue(1000, "withdraw"), "");
  assert.equal(amountIssue(100, "deposit"), "");
});

test("disbursement account is 237 plus the 9-digit MSISDN", () => {
  assert.equal(disbursementAccount("677000000"), "237677000000");
  assert.equal(disbursementAccount("+237 677 000 000"), "237677000000");
  assert.equal(disbursementAccount("237677000000"), "237677000000");
  assert.equal(disbursementAccount("12"), "");
});

test("PayUnit webhook nested data is unwrapped", () => {
  const parsed = unwrapPayunitNotify({
    status: "SUCCESS",
    statusCode: 200,
    message: "payment has been collected",
    data: {
      transaction_id: "DISB123",
      transaction_status: "SUCCESS",
      pay_token: "tok_1",
    },
  });
  assert.equal(parsed.reference, "DISB123");
  assert.equal(parsed.rawStatus, "SUCCESS");
  assert.equal(parsed.payToken, "tok_1");
  assert.equal(railStatus(parsed.rawStatus), "success");
});

test("PayUnit envelope SUCCESS does not override a pending deposit", () => {
  const parsed = unwrapPayunitNotify({
    status: "SUCCESS",
    data: {
      transaction_id: "QT99",
      payment_status: "PENDING",
    },
  });
  assert.equal(parsed.reference, "QT99");
  assert.equal(railStatus(parsed.rawStatus), "pending");
});

test("pay_token is read from create and confirm shapes", () => {
  assert.equal(pickPayToken({ pay_token: "abc" }), "abc");
  assert.equal(pickPayToken({ data: { pay_token: "nested" } }), "nested");
  assert.equal(pickPayToken({ deposit_reference_token: "ref" }), "ref");
});

test("disbursement text is sanitized for PayUnit", () => {
  assert.equal(sanitizeDisburseText("Jean-Luc!", "LBPay user"), "Jean-Luc");
  assert.equal(sanitizeDisburseText("", "LBPay user"), "LBPay user");
});

test("PayUnit dashboard host is rewritten to the gateway API", () => {
  assert.equal(payunitGatewayUrl("https://app.payunit.net"), "https://gateway.payunit.net");
  assert.equal(payunitGatewayUrl("https://gateway.payunit.net"), "https://gateway.payunit.net");
});

test("payment link patches can change title without wiping the photo", () => {
  const parsed = parsePaymentLinkPatch({ title: "New shoes", amount: 5000 });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.title, "New shoes");
    assert.equal(parsed.value.amount, 5000);
    assert.equal(parsed.value.imageUrl, undefined);
    assert.equal(parsed.value.template, undefined);
  }
});

test("PayUnit merchant float and approval errors are not hidden as temporarily unavailable", () => {
  assert.equal(mapRailError("Insufficient float on merchant account").code, "INSUFFICIENT_MERCHANT_FLOAT");
  assert.equal(mapRailError("Approval required for this disbursement").code, "DISBURSEMENT_APPROVAL");
});

test("PayUnit 401 activate-collection is not shown as a generic outage", () => {
  const mapped = mapRailError(
    "Authentication failed. Please check your credentials or authorisations needed. can't process operation, contact admin to activate collection",
  );
  assert.equal(mapped.code, "PAYUNIT_PRODUCT_NOT_ACTIVE");
});
