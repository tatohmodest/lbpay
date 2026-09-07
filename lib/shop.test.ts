import assert from "node:assert/strict";
import { test } from "node:test";
import { productExcerpt, productPricing, productShareText, publicProductsFromLinks, shopShareText } from "./shop";

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

test("sale pricing only shows when original is higher than selling price", () => {
  assert.deepEqual(productPricing(8500, 12000), {
    price: 8500,
    original: 12000,
    onSale: true,
    percentOff: 29,
  });
  assert.equal(productPricing(12000, 8500).onSale, false);
  assert.equal(productPricing(null, 12000).onSale, false);
});

test("public shop keeps details and discounted prices", () => {
  const products = publicProductsFromLinks([
    {
      slug: "oil",
      title: "Red oil",
      amount: 8500,
      compareAtAmount: 12000,
      description: "One litre, sealed.",
      status: "active",
    },
    {
      slug: "soap",
      title: "Soap",
      amount: 2000,
      compareAtAmount: 1500,
      status: "active",
    },
  ]);
  assert.equal(products[0].compareAtAmount, 12000);
  assert.equal(products[0].description, "One litre, sealed.");
  assert.equal(products[1].compareAtAmount, undefined);
  assert.equal(productExcerpt("Fresh from the market this morning and sealed tight.", 24), "Fresh from the market…");
});
