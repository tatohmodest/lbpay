import { NextResponse } from "next/server";
import { adminSnapshot, grantRole, listUsers, publicUser, revokeRole, upsertUser, writeAudit } from "@/lib/server/db";
import { ADMIN_SCOPES, adminScopesFor, isAdminOwner, type AdminScope } from "@/lib/roles";
import { requireAdmin } from "@/lib/server/guard";
import type { AccountKind } from "@/lib/types";
import { pushAccount } from "@/lib/server/push";

export async function GET() {
  const auth = await requireAdmin("users");
  if (auth.error || !auth.user) return auth.error!;
  const snap = await adminSnapshot();
  const rows = snap.users
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((user) => ({
      ...publicUser(user),
      balance: snap.balances.get(user.id) ?? 0,
      createdAt: user.createdAt,
      owner: isAdminOwner(user),
      adminScopes: adminScopesFor(user),
    }));
  return NextResponse.json({
    users: rows,
    viewer: { id: auth.user.id, owner: isAdminOwner(auth.user) },
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin("users");
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const owner = isAdminOwner(auth.user);
  const touchesAdmin = body.role === "admin" || body.action === "scopes";
  // Creating admins, removing them, or changing what they can do is owner-only.
  if (touchesAdmin && !owner) {
    return NextResponse.json({ error: "Only an owner can manage admins." }, { status: 403 });
  }
  const userId = String(body.userId || "");
  const users = await listUsers();
  const target = users.find((item) => item.id === userId);
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (isAdminOwner(target) && !owner) {
    return NextResponse.json({ error: "Only an owner can change an owner's account." }, { status: 403 });
  }

  if (body.action === "freeze") {
    target.status = "frozen";
    await upsertUser(target);
    await writeAudit({ actorId: auth.user.id, action: "user.freeze", targetType: "user", targetId: target.id });
    void pushAccount(
      target.id,
      "Account frozen",
      "Your LBPay account is frozen. Money cannot move until an admin restores it.",
      "/wallet/profile",
    );
  } else if (body.action === "unfreeze") {
    target.status = "active";
    await upsertUser(target);
    await writeAudit({ actorId: auth.user.id, action: "user.unfreeze", targetType: "user", targetId: target.id });
    void pushAccount(
      target.id,
      "Account restored",
      "Your LBPay account is active again.",
      "/wallet",
    );
  } else if (body.action === "grant") {
    const role = String(body.role || "") as AccountKind;
    if (!["personal", "business", "developer", "admin"].includes(role)) {
      return NextResponse.json({ error: "Unknown role." }, { status: 400 });
    }
    // New staff start with support only; the owner widens it from the Users page.
    if (role === "admin" && !target.roles.includes("admin")) target.adminScopes = ["support"];
    await grantRole(target, role);
    await writeAudit({
      actorId: auth.user.id,
      action: "role.grant",
      targetType: "user",
      targetId: target.id,
      note: role,
    });
  } else if (body.action === "revoke") {
    const role = String(body.role || "") as AccountKind;
    if (role === "admin" && target.id === auth.user.id) {
      return NextResponse.json({ error: "You cannot drop your own admin role." }, { status: 400 });
    }
    await revokeRole(target, role);
    await writeAudit({
      actorId: auth.user.id,
      action: "role.revoke",
      targetType: "user",
      targetId: target.id,
      note: role,
    });
  } else if (body.action === "scopes") {
    if (!target.roles.includes("admin")) {
      return NextResponse.json({ error: "Make this person an admin first." }, { status: 400 });
    }
    const scopes = (Array.isArray(body.scopes) ? body.scopes : []).filter((x: unknown): x is AdminScope =>
      (ADMIN_SCOPES as readonly string[]).includes(String(x)),
    );
    target.adminScopes = scopes;
    target.rolesUpdatedAt = new Date().toISOString();
    await upsertUser(target);
    await writeAudit({
      actorId: auth.user.id,
      action: "admin.scopes",
      targetType: "user",
      targetId: target.id,
      note: scopes.join(",") || "none",
    });
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, user: publicUser(target) });
}
