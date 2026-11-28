/**
 * Throwaway inbox services used to mass-create accounts. Signing up with one is
 * refused: a payment account needs an inbox its owner keeps.
 */
const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "sharklasers.com",
  "grr.la", "guerrillamailblock.com", "10minutemail.com", "10minutemail.net", "temp-mail.org",
  "tempmail.com", "tempmail.net", "temp-mail.io", "tempmailo.com", "tempr.email", "throwawaymail.com",
  "yopmail.com", "yopmail.fr", "yopmail.net", "trashmail.com", "trashmail.de", "getnada.com", "nada.email",
  "dispostable.com", "maildrop.cc", "mailnesia.com", "mintemail.com", "mohmal.com", "emailondeck.com",
  "fakeinbox.com", "fakemail.net", "spamgourmet.com", "mailcatch.com", "moakt.com", "mytemp.email",
  "tmpmail.org", "tmpmail.net", "tmail.ws", "burnermail.io", "inboxkitten.com", "spambox.us",
  "mail.tm", "mail.gw", "1secmail.com", "1secmail.net", "1secmail.org", "emailfake.com", "byom.de",
  "dropmail.me", "linshiyouxiang.net", "tempinbox.com", "discard.email", "mailpoof.com", "33mail.com",
  "anonaddy.me", "cock.li", "harakirimail.com", "luxusmail.org", "minuteinbox.com", "tempail.com",
  "trbvm.com", "vomoto.com", "wegwerfmail.de", "zetmail.com", "emltmp.com", "rteet.com", "dcctb.com",
]);

export function isDisposableEmail(email: string) {
  const domain = email.trim().toLowerCase().split("@")[1] || "";
  if (!domain) return false;
  if (DISPOSABLE.has(domain)) return true;
  // Subdomains of these services (x.mailinator.com) too.
  return [...DISPOSABLE].some((d) => domain.endsWith(`.${d}`));
}
