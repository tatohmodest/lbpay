import { NextResponse } from "next/server";
import {
  findUserByEmail,
  grantRole,
  listAdminInvites,
  removeAdminInvite,
  saveAdminInvite,
  upsertUser,
  writeAudit,
} from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/guard";
import { ADMIN_SCOPES, adminScopesFor, isAdminOwner, type AdminScope } from "@/lib/roles";
import { sendSupportNotice } from "@/lib/server/mail";
import { pushAccount } from "@/lib/server/push";
import { SITE_URL } from "@/lib/site";

export async function GET() {
  const auth = await requireAdmin("users");
  if (auth.error || !auth.user) return auth.error!;
  return NextResponse.json({ invites: await listAdminInvites() });
}

/**
 * Invite someone to the admin team by email.
 * - Already on LBPay: they become admin now and get an email + notification.
 * - Not yet: the invite waits; they become admin once they sign up and verify that email.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin("users");
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  const owner = isAdminOwner(auth.user);
  const mine = adminScopesFor(auth.user);
  const scopes = (Array.isArray(body.scopes) ? body.scopes : ["support"]).filter((x: unknown): x is AdminScope =>
    (ADMIN_SCOPES as readonly string[]).includes(String(x)),
  );
  if (!scopes.length) return NextResponse.json({ error: "Pick at least one permission." }, { status: 400 });
  if (!owner && scopes.some((x: AdminScope) => !mine.includes(x))) {
    return NextResponse.json({ error: "You can only give permissions you have yourself." }, { status: 403 });
  }

  const inviter = auth.user.name || "An LBPay admin";
  const existing = await findUserByEmail(email);
  if (existing) {
    if (existing.roles.includes("admin")) {
      return NextResponse.json({ error: "This person is already an admin." }, { status: 409 });
    }
    existing.adminScopes = scopes;
    await grantRole(existing, "admin");
    await upsertUser(existing);
    await writeAudit({ actorId: auth.user.id, action: "admin.invite", targetType: "user", targetId: existing.id, note: scopes.join(",") });
    await Promise.allSettled([
      pushAccount(existing.id, "You're now an LBPay admin", `${inviter} added you to the admin team.`, "/admin"),
      sendSupportNotice({
        to: email,
        title: "You're now an LBPay admin",
        intro: `${inviter} added you to the LBPay admin team.`,
        body: `Your access: ${scopes.join(", ")}.\nOpen admin from your profile, or use the link below.`,
        href: `${SITE_URL}/admin`,
        cta: "Open admin",
      }),
    ]);
    return NextResponse.json({ ok: true, status: "added" });
  }

  await saveAdminInvite({ email, scopes, invitedBy: auth.user.id, createdAt: new Date().toISOString() });
  await writeAudit({ actorId: auth.user.id, action: "admin.invite", targetType: "invite", targetId: email, note: scopes.join(",") });
  const sent = await sendSupportNotice({
    to: email,
    title: "You're invited to the LBPay admin team",
    intro: `${inviter} invited you to help run LBPay.`,
    body: `Create your LBPay account with this email (${email}). Admin access turns on as soon as you confirm the code we email you.`,
    href: `${SITE_URL}/signup?email=${encodeURIComponent(email)}`,
    cta: "Create my account",
  }).catch(() => ({ delivered: false }));
  return NextResponse.json({ ok: true, status: "invited", emailed: sent.delivered });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin("users");
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const removed = await removeAdminInvite(email);
  if (removed) {
    await writeAudit({ actorId: auth.user.id, action: "admin.invite.cancel", targetType: "invite", targetId: email });
  }
  return NextResponse.json({ ok: true, removed });
}
