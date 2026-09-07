import assert from "node:assert/strict";
import { test } from "node:test";
import { fcmHttpV1Body, parseFirebaseServiceAccount } from "./fcm";

test("parseFirebaseServiceAccount reads project, email, and PKCS8 key", () => {
  const parsed = parseFirebaseServiceAccount(
    JSON.stringify({
      type: "service_account",
      project_id: "lbpay-89179",
      client_email: "firebase-adminsdk-fbsvc@lbpay-89179.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIB\n-----END PRIVATE KEY-----\n",
    }),
  );
  assert.equal(parsed?.project_id, "lbpay-89179");
  assert.equal(parsed?.client_email, "firebase-adminsdk-fbsvc@lbpay-89179.iam.gserviceaccount.com");
  assert.match(parsed?.private_key || "", /BEGIN PRIVATE KEY/);
  assert.match(parsed?.private_key || "", /\n/);
});

test("parseFirebaseServiceAccount rejects empty or incomplete JSON", () => {
  assert.equal(parseFirebaseServiceAccount(""), null);
  assert.equal(parseFirebaseServiceAccount("{"), null);
  assert.equal(parseFirebaseServiceAccount(JSON.stringify({ project_id: "x" })), null);
});

test("fcmHttpV1Body uses the money-alert channel and custom sound", () => {
  const body = fcmHttpV1Body("token-1", {
    title: "Money received",
    body: "5 000 XAF from Marthe",
    url: "/wallet/history",
    tag: "tx:1",
  });
  assert.equal(body.message.token, "token-1");
  assert.equal(body.message.android.priority, "HIGH");
  assert.equal(body.message.android.notification.channelId, "lbpay_money");
  assert.equal(body.message.android.notification.sound, "lbpay_alert");
  assert.equal(body.message.data.url, "/wallet/history");
});
