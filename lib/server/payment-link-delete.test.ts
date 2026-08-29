import assert from "node:assert/strict";
import { test } from "node:test";
import { cloudinaryPublicId } from "./cloudinary";
import { mergeById, mergePaymentLinks, uniqueIds } from "./ledger-merge";
import { paymentLinkIdFromRequest } from "./payment-links";

test("ledger merge does not resurrect a deleted payment link", () => {
  const remote = [
    { id: "lnk_keep", slug: "keep-1", title: "Keep" },
    { id: "lnk_gone", slug: "gone-1", title: "Gone" },
  ];
  const local = [{ id: "lnk_keep", slug: "keep-1", title: "Keep" }];
  const deleted = uniqueIds([["lnk_gone", "gone-1"]]);
  const merged = mergePaymentLinks(remote, local, deleted);
  assert.deepEqual(
    merged.map((item) => item.id),
    ["lnk_keep"],
  );
});

test("ledger merge keeps a link created on another writer", () => {
  const remote = [
    { id: "lnk_old", slug: "old-1", title: "Old" },
    { id: "lnk_new", slug: "new-1", title: "New" },
  ];
  const local = [{ id: "lnk_old", slug: "old-1", title: "Old" }];
  const merged = mergePaymentLinks(remote, local, []);
  assert.equal(merged.length, 2);
  assert.ok(merged.some((item) => item.id === "lnk_new"));
});

test("union-by-id merge is what used to put deleted links back", () => {
  const remote = [{ id: "lnk_gone", slug: "gone-1" }];
  const local: Array<{ id: string; slug: string }> = [];
  assert.equal(mergeById(remote, local).length, 1);
  assert.equal(mergePaymentLinks(remote, local, ["lnk_gone"]).length, 0);
});

test("Cloudinary public id is parsed from transformed delivery URLs", () => {
  const transformed =
    "https://res.cloudinary.com/demo/image/upload/c_limit,w_1280/v1710000000/lbpay/links/user1/abc.jpg";
  const plain = "https://res.cloudinary.com/demo/image/upload/v1710000000/lbpay/links/user1/abc.jpg";
  const eager =
    "https://res.cloudinary.com/demo/image/upload/c_limit,w_1280,h_1280/q_auto:eco/f_jpg/v1710000000/lbpay/links/user1/abc.webp";
  assert.equal(cloudinaryPublicId(transformed), "lbpay/links/user1/abc");
  assert.equal(cloudinaryPublicId(plain), "lbpay/links/user1/abc");
  assert.equal(cloudinaryPublicId(eager), "lbpay/links/user1/abc");
  assert.equal(cloudinaryPublicId("lbpay/links/user1/abc"), "lbpay/links/user1/abc");
});

test("DELETE can read the payment link id from the query string", async () => {
  const request = new Request("https://lbpay.test/api/business?id=lnk_123", { method: "DELETE" });
  assert.equal(await paymentLinkIdFromRequest(request), "lnk_123");
});
