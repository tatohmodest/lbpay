import { NextResponse } from "next/server";
import { findKycById, findUserById, grantRole, listKyc, saveKyc, upsertUser, writeAudit } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/guard";
import { issueLiveKey } from "@/lib/server/apikey";
import { publicUser } from "@/lib/server/db";
import { pushAccount } from "@/lib/server/push";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) return auth.error!;
  const apps = await listKyc();
  const rows = [];
  for (const app of apps) {
    const user = await findUserById(app.userId);
    rows.push({ ...app, user: user ? publicUser(user) : null });
  }
  rows.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return +new Date(b.createdAt) - +new Date(a.createdAt);
  });
  return NextResponse.json({ applications: rows });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const app = await findKycById(String(body.id || ""));
  if (!app) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  const user = await findUserById(app.userId);
  if (!user) return NextResponse.json({ error: "User missing." }, { status: 404 });
  const decision = body.decision === "reject" ? "rejected" : "approved";
  app.status = decision;
  app.reviewNote = String(body.note || "");
  app.reviewedAt = new Date().toISOString();
  app.reviewedBy = auth.user.id;
  await saveKyc(app);

  if (decision === "approved") {
    user.kyc = { ...user.kyc, [app.track]: "verified" };
    if (app.track === "personal") user.kycStatus = "verified";
    if (app.track === "business") {
      await grantRole(user, "business");
      user.businessName = app.businessName || user.businessName;
    }
    if (app.track === "developer") {
      await grantRole(user, "developer");
      await issueLiveKey(user);
    }
    await upsertUser(user);
  } else {
    user.kyc = { ...user.kyc, [app.track]: "rejected" };
    await upsertUser(user);
  }

  await writeAudit({
    actorId: auth.user.id,
    action: `kyc.${decision}`,
    targetType: "kyc",
    targetId: app.id,
    note: `${app.track} · ${user.lbpayId}`,
  });
  void pushAccount(
    user.id,
    decision === "approved" ? "KYC approved" : "KYC update",
    decision === "approved"
      ? `Your ${app.track} verification is approved.`
      : `Your ${app.track} verification was not approved.`,
    app.track === "business" ? "/business" : app.track === "developer" ? "/developers" : "/wallet/profile",
  );
  return NextResponse.json({ ok: true, application: app });
}
