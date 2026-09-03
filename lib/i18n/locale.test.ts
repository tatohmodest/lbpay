import assert from "node:assert/strict";
import { test } from "node:test";
import { localeFromAcceptLanguage, localeFromCookieHeader, localeFromNavigator, localeFromRequest } from "./locale";
import { translate } from "./messages";

test("French Accept-Language wins, including Cameroon tags", () => {
  assert.equal(localeFromAcceptLanguage("fr-CM,fr;q=0.9,en;q=0.8"), "fr");
  assert.equal(localeFromAcceptLanguage("fr"), "fr");
  assert.equal(localeFromAcceptLanguage("en-GB,en;q=0.9"), "en");
  assert.equal(localeFromAcceptLanguage("de,en;q=0.4"), "en");
  assert.equal(localeFromAcceptLanguage(""), "en");
});

test("cookie locale is preferred on the request", () => {
  assert.equal(localeFromCookieHeader("theme=light; lbpay_lang=fr"), "fr");
  const request = new Request("https://lbpay.cm/signup", {
    headers: { cookie: "lbpay_lang=en", "accept-language": "fr-FR" },
  });
  assert.equal(localeFromRequest(request), "en");
});

test("navigator languages detect French phones", () => {
  assert.equal(localeFromNavigator(["fr-CM", "fr", "en"]), "fr");
  assert.equal(localeFromNavigator(["en-US"]), "en");
});

test("French copy is used for the signup error", () => {
  assert.match(translate("fr", "errors.generic"), /quelques minutes/);
  assert.equal(translate("en", "auth.createAccount"), "Create account");
  assert.equal(translate("fr", "auth.createAccount"), "Créer un compte");
});
