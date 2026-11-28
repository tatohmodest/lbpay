import { NextResponse } from "next/server";
import { createKyc, listKycForUser, upsertUser } from "@/lib/server/db";
import { requireActiveUser } from "@/lib/server/guard";
import { isUserOwnKycUrl } from "@/lib/server/cloudinary";
import { alertNewKyc } from "@/lib/server/kyc-alerts";
import { isBusinessKind, kycDocsComplete, type KycDocuments, type KycDocumentType } from "@/lib/kyc";
import type { KycApplicationTrack } from "@/lib/types";

function isKycApplicationTrack(value: unknown): value is KycApplicationTrack {
  return typeof value === "string" && ["personal", "business", "developer", "badge"].includes(value);
}

export async function GET() {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  return NextResponse.json({ applications: await listKycForUser(auth.user.id), kyc: auth.user.kyc });
}

export async function POST(request: Request) {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const parsed: unknown = await request.json().catch(() => ({}));
  const body = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  if (!isKycApplicationTrack(body.track)) {
    return NextResponse.json({ error: "Choose a valid verification type." }, { status: 400 });
  }
  const track = body.track;
  let legalName = String(body.legalName || auth.user.name).trim();
  let idNumber = String(body.idNumber || "").trim();
  let documentType: KycDocumentType = body.documentType === "passport" ? "passport" : "national_id";
  const documents = body.documents as Partial<KycDocuments> | undefined;

  if (track !== "badge" && auth.user.kyc[track] === "verified") {
    return NextResponse.json({ error: "This verification is already approved." }, { status: 409 });
  }
  if (track === "badge" && auth.user.verifiedBadge === "verified") {
    return NextResponse.json({ error: "Your verified badge is already approved." }, { status: 409 });
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

  const businessName = String(body.businessName || "").trim();
  const businessKind = isBusinessKind(body.businessKind) ? body.businessKind : undefined;
  const taxId = String(body.taxId || "").trim();
  const website = String(body.website || "").trim();
  const note = String(body.note || "").trim();

  if (track === "badge") {
    if (note.length < 20) {
      return NextResponse.json({ error: "Tell us a little more about why you are requesting a badge." }, { status: 400 });
    }
  } else if (track === "business") {
    if (!businessKind) {
      return NextResponse.json({ error: "Choose small business or branded business." }, { status: 400 });
    }
    if (!businessName) {
      return NextResponse.json({ error: "Business name is required." }, { status: 400 });
    }
    const personalApp = (await listKycForUser(auth.user.id)).find(
      (item) => item.track === "personal" && item.status === "approved",
    );
    legalName = personalApp?.legalName || auth.user.name;
    idNumber = personalApp?.idNumber || "";
    documentType = personalApp?.documentType || "national_id";
  } else {
    if (!legalName) {
      return NextResponse.json({ error: "Legal name is required." }, { status: 400 });
    }
    if (!idNumber) {
      return NextResponse.json({ error: "National ID / passport number is required." }, { status: 400 });
    }
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
    if (urls.some((url) => !isUserOwnKycUrl(url, auth.user!.id))) {
      return NextResponse.json({ error: "Upload your own KYC photos through LBPay." }, { status: 400 });
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
    legalName: track === "badge" ? auth.user.name : legalName,
    idNumber: track === "badge" ? "" : idNumber,
    phone: String(body.phone || auth.user.phone),
    businessName: track === "business" ? businessName : "",
    businessKind: track === "business" ? businessKind : undefined,
    taxId: track === "business" && businessKind === "branded" ? taxId : "",
    website: track === "developer" || (track === "business" && businessKind === "branded") ? website : "",
    documentType,
    documents: storedDocs,
    note,
  });

  if (track === "badge") auth.user.verifiedBadge = "pending";
  else auth.user.kyc = { ...auth.user.kyc, [track]: "pending" };
  if (track === "personal") auth.user.kycStatus = "pending";
  if (track === "business") {
    auth.user.businessName = businessName || auth.user.businessName || "";
    auth.user.businessKind = businessKind;
  }
  await upsertUser(auth.user);
  await alertNewKyc(app, auth.user);

  return NextResponse.json({ ok: true, application: app, user: auth.user });
}
