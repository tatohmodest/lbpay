import { NextResponse } from "next/server";
import { createKyc, grantRole, listKycForUser, upsertUser } from "@/lib/server/db";
import { requireActiveUser } from "@/lib/server/guard";
import { issueSandboxKey } from "@/lib/server/apikey";
import { isOurCloudinaryUrl } from "@/lib/server/cloudinary";
import { kycDocsComplete, type KycDocuments, type KycDocumentType } from "@/lib/kyc";
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
  const documentType: KycDocumentType = body.documentType === "passport" ? "passport" : "national_id";
  const documents = body.documents as Partial<KycDocuments> | undefined;

  if (!legalName) {
    return NextResponse.json({ error: "Legal name is required." }, { status: 400 });
  }
  if (!idNumber) {
    return NextResponse.json({ error: "National ID / passport number is required." }, { status: 400 });
  }

  if (auth.user.kyc[track] === "verified") {
    return NextResponse.json({ error: "This verification is already approved." }, { status: 409 });
  }

  const existing = (await listKycForUser(auth.user.id)).find(
    (item) => item.track === track && item.status === "pending",
  );
  if (existing) {
    return NextResponse.json({ error: "You already have a pending application for this track." }, { status: 409 });
  }

  if (track === "business" && auth.user.kyc.personal !== "verified") {
    return NextResponse.json(
      { error: "Complete personal identity verification before applying for Business." },
      { status: 403 },
    );
  }

  let storedDocs: KycDocuments | undefined;
  if (track === "personal" || track === "developer") {
    if (!kycDocsComplete(documents)) {
      return NextResponse.json(
        { error: "Upload the front, back, and a photo of you holding the document." },
        { status: 400 },
      );
    }
    const urls = [documents.idFrontUrl, documents.idBackUrl, documents.selfieUrl];
    if (urls.some((url) => !isOurCloudinaryUrl(url))) {
      return NextResponse.json({ error: "Upload the photos through LBPay." }, { status: 400 });
    }
    storedDocs = {
      idFrontUrl: documents.idFrontUrl,
      idBackUrl: documents.idBackUrl,
      selfieUrl: documents.selfieUrl,
      idFrontId: documents.idFrontId,
      idBackId: documents.idBackId,
      selfieId: documents.selfieId,
    };
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
    documentType,
    documents: storedDocs,
    note: String(body.note || ""),
  });

  auth.user.kyc = { ...auth.user.kyc, [track]: "pending" };
  if (track === "personal") auth.user.kycStatus = "pending";
  if (track === "developer") {
    const firstApply = !auth.user.roles.includes("developer");
    await grantRole(auth.user, "developer");
    if (firstApply) await issueSandboxKey(auth.user);
  }
  if (track === "business") {
    auth.user.businessName = String(body.businessName || auth.user.businessName || "");
  }
  await upsertUser(auth.user);

  return NextResponse.json({ ok: true, application: app, user: auth.user });
}
