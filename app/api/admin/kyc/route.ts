import { NextResponse } from "next/server";
import { adminSnapshot, findKycById, listKeys, publicUser, reviewKycApplication, writeAudit } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/guard";
import { issueLiveKey, issueSandboxKey } from "@/lib/server/apikey";
import { pushAccount } from "@/lib/server/push";

export async function GET() {
  const auth = await requireAdmin("kyc");
  if (auth.error || !auth.user) return auth.error!;
  const snap = await adminSnapshot();
  const byId = new Map(snap.users.map((u) => [u.id, u] as const));
  const rows = snap.kyc.map((app) => {
    const user = byId.get(app.userId);
    return { ...app, user: user ? publicUser(user) : null };
  });
  rows.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return +new Date(b.createdAt) - +new Date(a.createdAt);
  });
  return NextResponse.json({ applications: rows });
}

export async function POST(request: Request) {
  const auth = await requireAdmin("kyc");
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const app = await findKycById(String(body.id || ""));
  if (!app) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  const decision = body.decision === "reject" ? "rejected" : "approved";
  const note = String(body.note || "").trim().slice(0, 500);
  // Decide pending applications only. "Approve" on an already-approved one is the
  // explicit "restore access" repair; a rejected application stays rejected (they re-apply).
  if (app.status === "rejected") {
    return NextResponse.json({ error: "This application was rejected. The person needs to send a new one." }, { status: 409 });
  }
  if (app.status === "approved" && decision === "rejected") {
    return NextResponse.json({ error: "This application is already approved." }, { status: 409 });
  }
  if (decision === "rejected" && !note) {
    return NextResponse.json({ error: "Say why, so the person knows what to fix." }, { status: 400 });
  }

  let reviewed;
  try {
    reviewed = await reviewKycApplication({
      app,
      decision,
      note,
      reviewerId: auth.user.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update KYC.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (decision === "approved" && app.track === "developer") {
    const keys = await listKeys(reviewed.user.id);
    if (!keys.some((key) => key.env === "sandbox" && !key.revokedAt)) await issueSandboxKey(reviewed.user);
    if (!keys.some((key) => key.env === "live" && !key.revokedAt)) await issueLiveKey(reviewed.user);
  }

  await writeAudit({
    actorId: auth.user.id,
    action: `kyc.${decision}`,
    targetType: "kyc",
    targetId: app.id,
    note: `${app.track} · ${reviewed.user.lbpayId}`,
  });
  void pushAccount(
    reviewed.user.id,
    decision === "approved" ? "KYC approved" : "KYC update",
    decision === "approved"
      ? `Your ${app.track} verification is approved.`
      : `Your ${app.track} verification was not approved: ${note}`,
    app.track === "business" ? "/business" : app.track === "developer" ? "/developers" : "/wallet/profile",
  );
  return NextResponse.json({
    ok: true,
    application: reviewed.application,
    user: publicUser(reviewed.user),
  });
}
