import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalEmail, fakeAccountReason } from "./fake-accounts";

test("test-style and junk accounts are caught", () => {
  for (const input of [
    { name: "Test User", email: "a@gmail.com" },
    { name: "Tester", email: "a@gmail.com" },
    { name: "Amina", email: "amina.test99@gmail.com" },
    { name: "Amina", email: "a@gmail.com", lbpayId: "test1" },
    { name: "aaaa", email: "a@gmail.com" },
    { name: "LBPay Support", email: "a@gmail.com" },
    { name: "12345", email: "a@gmail.com" },
    { name: "Paul", email: "paul@example.com" },
    { name: "qwrtpsd", email: "a@gmail.com" },
  ]) {
    assert.ok(fakeAccountReason(input), JSON.stringify(input));
  }
});

test("real Cameroonian names pass", () => {
  for (const input of [
    { name: "Amina Ngo Bassa", email: "amina.ngo@gmail.com", lbpayId: "amina" },
    { name: "Tatoh Modest", email: "tatohmodest525@gmail.com", lbpayId: "modest" },
    { name: "Célestine Mbarga", email: "celestine.mbarga@yahoo.fr", lbpayId: "celestine" },
    { name: "Jean-Pierre Fotso", email: "jp.fotso@outlook.com", lbpayId: "jpfotso" },
    { name: "Ngozi Ewane", email: "ngozi@loopingbinary.com", lbpayId: "ngozi" },
  ]) {
    assert.equal(fakeAccountReason(input), null, JSON.stringify(input));
  }
});

test("one Gmail inbox counts once however it is written", () => {
  assert.equal(canonicalEmail("A.Mina+2@Gmail.com"), "amina@gmail.com");
  assert.equal(canonicalEmail("amina@googlemail.com"), "amina@gmail.com");
  assert.equal(canonicalEmail("a.mina+x@yahoo.fr"), "a.mina@yahoo.fr");
});
