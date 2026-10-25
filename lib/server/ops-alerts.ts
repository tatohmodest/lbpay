import { CONTACT_EMAIL } from "@/lib/flags";
import { bootstrapAdminEmails, hasAdminScope } from "@/lib/roles";
import { SITE_URL } from "@/lib/site";
import { operatorIssue } from "@/lib/public-error";
import { listUsers } from "@/lib/server/db";
import { sendSupportNotice } from "@/lib/server/mail";
import { pushAccount } from "@/lib/server/push";

const WHAT: Record<string, string> = {
  PAYUNIT_PRODUCT_NOT_ACTIVE: "The payment gateway refused the request: the product is not activated on the merchant account.",
  AUTHENTICATION_FAILED: "The payment gateway rejected our API credentials.",
  INSUFFICIENT_MERCHANT_FLOAT: "The gateway merchant wallet does not have enough balance to pay out.",
  SERVICE_UNAVAILABLE: "Payments are not configured on the server.",
};

// One alert per problem per hour, so a queue of failing customers doesn't flood the inbox.
const lastSent = new Map<string, number>();
const HOUR = 60 * 60 * 1000;

/**
 * When a payment fails for a reason only the team can fix, tell the team right
 * away (email + push to finance staff). Never throws.
 */
export async function reportRailProblem(raw: unknown, flow: "payout" | "collection") {
  try {
    const code = operatorIssue(raw);
    if (!code) return;
    const key = `${flow}:${code}`;
    const now = Date.now();
    if (now - (lastSent.get(key) || 0) < HOUR) return;
    lastSent.set(key, now);

    const detail = raw instanceof Error ? raw.message : String(raw || "");
    const title = flow === "payout" ? "Withdrawals are failing" : "Deposits are failing";
    const emails = [...new Set([CONTACT_EMAIL, ...bootstrapAdminEmails()].map((e) => e.toLowerCase()))];
    const staff = (await listUsers()).filter((u) => u.status !== "frozen" && hasAdminScope(u, "finance"));

    await Promise.allSettled([
      ...emails.map((to) =>
        sendSupportNotice({
          to,
          title: `Action needed: ${title.toLowerCase()}`,
          intro: WHAT[code] || "The payment gateway is refusing requests.",
          body: `Customers see a calm "try again later" message and no money is taken from their wallets.\n\nGateway said: ${detail.slice(0, 300)}\n\nFix it on the gateway side (contact their support to activate it), then try a small withdrawal.`,
          href: `${SITE_URL}/admin/transactions`,
          cta: "Open admin",
        }),
      ),
      ...staff.map((s) => pushAccount(s.id, title, WHAT[code] || "The payment gateway is refusing requests.", "/admin")),
    ]);
  } catch (error) {
    console.error("[lbpay] ops alert failed", error);
  }
}
