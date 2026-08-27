import { NextResponse } from "next/server";
import { createKyc, grantRole, listKycForUser, upsertUser } from "@/lib/server/db";
import { requireActiveUser } from "@/lib/server/guard";
import { issueSandboxKey } from "@/lib/server/apikey";
import type { KycTrack } from "@/lib/types";

export async function GET() {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  return NextResponse.json({ applications: await listKycForUser(auth.user.id), kyc: auth.user.kyc });
}

export async function POST(request: Request) {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const track = (body.track === "business" || body.track === "developer" ? body.track : "personal") as KycTrack;
  const legalName = String(body.legalName || auth.user.name).trim();
  const idNumber = String(body.idNumber || "").trim();
  if (!idNumber) {
    return NextResponse.json({ error: "National ID / passport number is required." }, { status: 400 });
  }

  const existing = (await listKycForUser(auth.user.id)).find(
    (item) => item.track === track && item.status === "pending",
  );
  if (existing) {
    return NextResponse.json({ error: "You already have a pending application for this track." }, { status: 409 });
  }

  const app = await createKyc({
    userId: auth.user.id,
    track,
    legalName,
    idNumber,
    phone: String(body.phone || auth.user.phone),
    businessName: String(body.businessName || ""),
    taxId: String(body.taxId || ""),
    website: String(body.website || ""),
    note: String(body.note || ""),
  });

  auth.user.kyc = { ...auth.user.kyc, [track]: "pending" };
  if (track === "personal") auth.user.kycStatus = "pending";
  if (track === "developer") {
    await grantRole(auth.user, "developer");
    await issueSandboxKey(auth.user);
  }
  if (track === "business") {
    auth.user.businessName = String(body.businessName || auth.user.businessName || "");
  }
  await upsertUser(auth.user);

  return NextResponse.json({ ok: true, application: app, user: auth.user });
}
