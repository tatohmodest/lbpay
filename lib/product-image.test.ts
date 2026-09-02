import assert from "node:assert/strict";
import { test } from "node:test";
import { isSafeProductImageUrl, publicProductImageUrl } from "./product-image";
import { parsePaymentLinkInput } from "./server/payment-links";

test("product photos keep local uploads and Cloudinary https urls", () => {
  assert.equal(isSafeProductImageUrl("/uploads/links/usr_amina/img_abc.jpg"), true);
  assert.equal(isSafeProductImageUrl("/illustrations/gift-box.webp"), true);
  assert.equal(isSafeProductImageUrl("https://res.cloudinary.com/demo/image/upload/v1/shoe.jpg"), true);
  assert.equal(isSafeProductImageUrl("http://evil.example/x.jpg"), false);
  assert.equal(isSafeProductImageUrl("/uploads/links/../secret.jpg"), false);
  assert.equal(isSafeProductImageUrl("javascript:alert(1)"), false);
});

test("product image public url is absolute for sharing", () => {
  assert.equal(
    publicProductImageUrl("/uploads/links/usr_1/a.jpg", "https://lbpay.cm"),
    "https://lbpay.cm/uploads/links/usr_1/a.jpg",
  );
  assert.equal(publicProductImageUrl("https://res.cloudinary.com/demo/image/upload/v1/a.jpg", "https://lbpay.cm"), "https://res.cloudinary.com/demo/image/upload/v1/a.jpg");
  assert.equal(publicProductImageUrl("http://evil.example/x.jpg", "https://lbpay.cm"), "");
});

test("payment link create accepts a local product photo path", () => {
  const parsed = parsePaymentLinkInput({
    title: "Red oil",
    amount: 12500,
    imageUrl: "/uploads/links/usr_amina/img_oil.jpg",
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.value.imageUrl, "/uploads/links/usr_amina/img_oil.jpg");
});
