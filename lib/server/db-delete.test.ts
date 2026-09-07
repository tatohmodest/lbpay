import assert from "node:assert/strict";
import { test } from "node:test";
import type { StoredUser } from "./db";
import { anonymizeUserForDeletion } from "./db";

test("account deletion removes personal data while preserving a safe non-login record", () => {
  const original: StoredUser = {
    id: "usr_123",
    name: "Ada Lovelace",
    lbpayId: "ada",
    email: "ada@example.com",
    phone: "+237650000000",
    avatar: "/avatars/ada.png",
    passwordHash: "hash",
    pinHash: "pin",
    emailVerified: true,
    kycStatus: "verified",
    roles: ["personal", "admin"],
    status: "active",
    kyc: {
      personal: "verified",
      business: "unverified",
      developer: "unverified",
    },
    createdAt: "2024-01-01T00:00:00Z",
  };

  const deleted = anonymizeUserForDeletion(original);

  assert.equal(deleted.name, "Deleted user");
  assert.equal(deleted.status, "frozen");
  assert.equal(deleted.phone, "");
  assert.equal(deleted.pinHash, null);
  assert.equal(deleted.emailVerified, false);
  assert.notEqual(deleted.email, original.email);
  assert.notEqual(deleted.lbpayId, original.lbpayId);
  assert.ok(deleted.email.includes("@"));
});
