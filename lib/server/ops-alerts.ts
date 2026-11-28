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

const approvalSent = new Set<string>();

/**
 * PayUnit holds some payouts (often larger ones) until someone approves them on
 * the PayUnit dashboard. Until then the customer only sees "pending", so tell
 * the team at once, with what to look for. Once per payout. Never throws.
 */
export async function alertPayoutApproval(input: { reference: string; payToken?: string; amount: number; phone: string }) {
  try {
    if (approvalSent.has(input.reference)) return;
    approvalSent.add(input.reference);
    const amount = `${input.amount.toLocaleString("en-US")} XAF`;
    const emails = [...new Set([CONTACT_EMAIL, ...bootstrapAdminEmails()].map((e) => e.toLowerCase()))];
    const staff = (await listUsers()).filter((u) => u.status !== "frozen" && hasAdminScope(u, "finance"));
    await Promise.allSettled([
      ...emails.map((to) =>
        sendSupportNotice({
          to,
          title: `Approve a ${amount} withdrawal on PayUnit`,
          intro: `PayUnit is holding a withdrawal of ${amount} to ${input.phone} until it is approved on the PayUnit dashboard.`,
          body: `The customer sees "pending" and the money is already reserved from their LBPay wallet.\n\nReference: ${input.reference}${input.payToken ? `\nPayUnit pay token: ${input.payToken}` : ""}\n\nApprove it in the PayUnit dashboard (Disbursements). LBPay picks up the result automatically. If you reject it there, LBPay refunds the wallet once PayUnit reports it failed.\n\nTo stop this for future withdrawals, ask PayUnit to raise or remove the approval threshold on your account.`,
          href: `${SITE_URL}/admin`,
          cta: "Open admin",
        }),
      ),
      ...staff.map((s) => pushAccount(s.id, "Withdrawal needs approval", `${amount} to ${input.phone} is waiting on the PayUnit dashboard.`, "/admin")),
    ]);
  } catch (error) {
    console.error("[lbpay] approval alert failed", error);
  }
}
