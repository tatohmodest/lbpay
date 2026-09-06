import assert from "node:assert/strict";
import { test } from "node:test";
import { productShareText, publicProductsFromLinks, shopShareText } from "./shop";

test("public shop hides inactive links and unsafe photos", () => {
  const products = publicProductsFromLinks([
    { slug: "oil", title: "Red oil", amount: 2500, status: "active", imageUrl: "/uploads/links/usr_1/oil.jpg" },
    { slug: "old", title: "Gone", amount: 100, status: "inactive" },
    { slug: "bad", title: "Hack", imageUrl: "javascript:alert(1)" },
    { slug: "", title: "Empty" },
  ]);
  assert.equal(products.length, 2);
  assert.deepEqual(products[0], {
    slug: "oil",
    title: "Red oil",
    amount: 2500,
    imageUrl: "/uploads/links/usr_1/oil.jpg",
  });
  assert.equal(products[1].imageUrl, undefined);
});

test("share copy names the shop and the product", () => {
  assert.match(shopShareText("Marthe Shop", "https://lbpay.cm/p/marthe"), /Marthe Shop/);
  assert.match(productShareText("Running Shoes", 15000, "https://lbpay.cm/pay/shoes"), /15\s?000/);
});
