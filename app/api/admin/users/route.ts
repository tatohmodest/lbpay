import { NextResponse } from "next/server";
import { getWallet, grantRole, listUsers, publicUser, revokeRole, upsertUser, writeAudit } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/guard";
import type { AccountKind } from "@/lib/types";
import { pushAccount } from "@/lib/server/push";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) return auth.error!;
  const users = await listUsers();
  const rows = [];
  for (const user of users) {
    const wallet = await getWallet(user.id);
    rows.push({ ...publicUser(user), balance: wallet.balance });
  }
  return NextResponse.json({ users: rows });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const userId = String(body.userId || "");
  const users = await listUsers();
  const target = users.find((item) => item.id === userId);
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

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
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, user: publicUser(target) });
}
