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
  assert.equal(isSafeProductImageUrl("data:image/jpeg;base64,/9j/4AAQSkZJRg=="), true);
  assert.equal(isSafeProductImageUrl("data:text/html;base64,PHNjcmlwdD4="), false);
});

test("product image public url is absolute for sharing", () => {
  assert.equal(
    publicProductImageUrl("/uploads/links/usr_1/a.jpg", "https://lbpay.cm"),
    "https://lbpay.cm/uploads/links/usr_1/a.jpg",
  );
  assert.equal(publicProductImageUrl("https://res.cloudinary.com/demo/image/upload/v1/a.jpg", "https://lbpay.cm"), "https://res.cloudinary.com/demo/image/upload/v1/a.jpg");
  assert.equal(publicProductImageUrl("http://evil.example/x.jpg", "https://lbpay.cm"), "");
});

test("payment link create keeps details and a higher original price", () => {
  const parsed = parsePaymentLinkInput({
    title: "Red oil",
    amount: 8500,
    compareAtAmount: 12000,
    description: "One litre bottle.",
    imageUrl: "/uploads/links/usr_amina/img_oil.jpg",
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.amount, 8500);
    assert.equal(parsed.value.compareAtAmount, 12000);
    assert.equal(parsed.value.description, "One litre bottle.");
    assert.equal(parsed.value.template, "display");
  }
});

test("payment link create rejects an original price that is not a discount", () => {
  const parsed = parsePaymentLinkInput({
    title: "Red oil",
    amount: 12000,
    compareAtAmount: 8500,
  });
  assert.equal(parsed.ok, false);
});
