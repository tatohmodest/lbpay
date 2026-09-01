import assert from "node:assert/strict";
import { test } from "node:test";
import { firstName } from "./format";

test("firstName keeps the given name only", () => {
  assert.equal(firstName("Amina T."), "Amina");
  assert.equal(firstName("Jean M."), "Jean");
  assert.equal(firstName(""), "");
});
