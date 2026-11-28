/**
 * Signals that an account is a throwaway or a probe. Such accounts are created
 * and can sign in like any other, but cannot move money, and nothing tells them
 * why: a refusal at sign-up would only teach the person which rule to dodge.
 */
const BAD_WORDS = new Set([
  "demo", "fake", "dummy", "sample", "example", "exemple", "admin", "administrator", "administrateur", "root",
  "hacker", "hack", "hacking", "anonymous", "anon", "anonyme", "user", "username", "utilisateur", "null",
  "undefined", "nan", "asdf", "asdfgh", "qwerty", "azerty", "xxx", "abc", "abcd", "foo", "bar", "foobar",
  "lbpay", "payunit", "support", "moderator", "staff", "official", "officiel", "bot", "robot", "spam",
]);

const BAD_EMAIL_DOMAINS = [/^example\.(com|org|net)$/, /^test\.(com|org|net)$/, /\.(test|example|invalid|localhost)$/, /^localhost$/];

function tokens(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function badToken(token: string) {
  if (token.startsWith("test")) return true; // test, tester, testing, test123, testeur
  if (BAD_WORDS.has(token)) return true;
  if (/^(user|demo|fake|admin|lbpay)\d+$/.test(token)) return true;
  if (/^(.)\1{2,}$/.test(token)) return true; // aaa, zzzz
  if (/^\d{2,}$/.test(token)) return true; // a name made of digits
  if (/^[bcdfghjklmnpqrstvwxz]{5,}$/.test(token)) return true; // keyboard mash, no vowels
  return false;
}

/** Gmail ignores dots and anything after "+": one inbox, many "different" emails. */
export function canonicalEmail(email: string) {
  const [local = "", domain = ""] = email.trim().toLowerCase().split("@");
  const base = local.split("+")[0];
  const gmail = domain === "gmail.com" || domain === "googlemail.com";
  return `${gmail ? base.replace(/\./g, "") : base}@${gmail ? "gmail.com" : domain}`;
}

/** Why an account looks fake from its own details, or null. */
export function fakeAccountReason(input: { name?: string; email?: string; lbpayId?: string; businessName?: string }) {
  const name = String(input.name || "");
  const letters = name.replace(/[^\p{L}]/gu, "");
  if (letters.length < 2) return "name has no real letters";
  if (tokens(name).some(badToken)) return `name "${name}"`;
  if (input.businessName && tokens(input.businessName).some(badToken)) return `business name "${input.businessName}"`;
  const handle = String(input.lbpayId || "").toLowerCase();
  if (handle.includes("test") || tokens(handle).some(badToken)) return `handle @${handle}`;
  const [local = "", domain = ""] = String(input.email || "").toLowerCase().split("@");
  if (local.includes("test")) return `email ${input.email}`;
  if (tokens(local.split("+")[0]).some((t) => BAD_WORDS.has(t) || /^(.)\1{2,}$/.test(t))) return `email ${input.email}`;
  if (BAD_EMAIL_DOMAINS.some((re) => re.test(domain))) return `email domain ${domain}`;
  return null;
}

/** Why this account is silently blocked from moving money, or null. Admins are never blocked. */
export function silentRestriction(user: {
  allowListed?: boolean;
  restricted?: string;
  roles?: string[];
  name?: string;
  email?: string;
  lbpayId?: string;
  businessName?: string;
}) {
  if (user.allowListed || user.roles?.includes("admin")) return null;
  return user.restricted || fakeAccountReason(user);
}

/** What a blocked account sees: the same words as a passing outage, nothing to learn from. */
export const SILENT_BLOCK_MESSAGE = "This service is busy right now. Please try again in a little while.";
