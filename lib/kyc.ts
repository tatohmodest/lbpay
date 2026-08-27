export const MAX_KYC_UPLOAD_BYTES = 10 * 1024 * 1024;
export const KYC_IMAGE_KINDS = ["idFront", "idBack", "selfie"] as const;

export type KycImageKind = (typeof KYC_IMAGE_KINDS)[number];
export type KycDocumentType = "national_id" | "passport";

export type KycDocuments = {
  idFrontUrl: string;
  idBackUrl: string;
  selfieUrl: string;
  idFrontId?: string;
  idBackId?: string;
  selfieId?: string;
};

export function isKycImageKind(value: string): value is KycImageKind {
  return (KYC_IMAGE_KINDS as readonly string[]).includes(value);
}

export function kycDocsComplete(docs: Partial<KycDocuments> | undefined | null): docs is KycDocuments {
  return Boolean(docs?.idFrontUrl && docs?.idBackUrl && docs?.selfieUrl);
}

export function kycKindLabel(kind: KycImageKind) {
  if (kind === "idFront") return "Front of ID or passport";
  if (kind === "idBack") return "Back of ID or passport";
  return "Photo of you holding the document";
}
