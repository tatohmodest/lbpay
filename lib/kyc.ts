export const MAX_KYC_UPLOAD_BYTES = 10 * 1024 * 1024;
export const KYC_IMAGE_KINDS = ["idFront", "idBack", "selfie"] as const;

export type KycImageKind = (typeof KYC_IMAGE_KINDS)[number];
export type KycDocumentType = "national_id" | "passport";
export type BusinessKind = "small" | "branded";

export const BUSINESS_KINDS = [
  {
    id: "small" as const,
    name: "Small business",
    blurb: "WhatsApp, a stall, or selling a few things online. No company papers.",
    image: "/illustrations/small-business.webp",
  },
  {
    id: "branded" as const,
    name: "Branded business",
    blurb: "A named shop or registered company. Tax ID is optional.",
    image: "/illustrations/branded-business.webp",
  },
];

export function isBusinessKind(value: unknown): value is BusinessKind {
  return value === "small" || value === "branded";
}

export function businessKindLabel(value: unknown) {
  return BUSINESS_KINDS.find((item) => item.id === value)?.name || "Business";
}

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
  if (kind === "idFront") return "Front";
  if (kind === "idBack") return "Back";
  return "You with your ID";
}
