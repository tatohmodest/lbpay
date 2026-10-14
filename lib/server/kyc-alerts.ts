import { CONTACT_EMAIL } from "@/lib/flags";
import { bootstrapAdminEmails, hasAdminScope } from "@/lib/roles";
import { SITE_URL } from "@/lib/site";
import { listUsers, type KycApplication, type StoredUser } from "@/lib/server/db";
import { sendSupportNotice } from "@/lib/server/mail";
import { pushAccount } from "@/lib/server/push";

const TRACK: Record<string, string> = {
  personal: "Identity",
  business: "Business",
  developer: "Developer",
};

/**
 * A new KYC application should never sit unseen: email the LBPay inbox and the
 * owners, and push a notification to every staff member allowed to review KYC.
 * Never throws; a failed alert must not fail the customer's submission.
 */
export async function alertNewKyc(app: KycApplication, user: StoredUser) {
  try {
    const track = TRACK[app.track] || app.track;
    const href = `${SITE_URL}/admin/kyc`;
    const who = `${user.name} (@${user.lbpayId})`;
    const staff = (await listUsers()).filter((u) => u.status !== "frozen" && hasAdminScope(u, "kyc"));
    const emails = [...new Set([CONTACT_EMAIL, ...bootstrapAdminEmails()].map((e) => e.toLowerCase()))];

    const lines = [
      `Who: ${who}`,
      `Email: ${user.email}`,
      `Check: ${track}`,
      app.businessName ? `Business: ${app.businessName}` : "",
      app.documents ? "Photos: front, back and holding ID attached" : "",
    ].filter(Boolean);

    await Promise.allSettled([
      // One email per inbox: some mail providers only deliver to the first address of a list.
      ...emails.map((to) =>
        sendSupportNotice({
          to,
          title: `New ${track.toLowerCase()} verification to review`,
          intro: `${who} just sent a ${track.toLowerCase()} verification.`,
          body: lines.join("\n"),
          href,
          cta: "Review it in admin",
        }),
      ),
      ...staff.map((s) =>
        pushAccount(s.id, `New ${track} KYC`, `${user.name} is waiting for review.`, "/admin/kyc"),
      ),
    ]);
  } catch (error) {
    console.error("[lbpay] KYC alert failed", error);
  }
}
