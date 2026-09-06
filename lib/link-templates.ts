export const LINK_TEMPLATES = [
  {
    id: "statement",
    name: "Statement",
    blurb: "Bank-style payment sheet",
  },
  {
    id: "invoice",
    name: "Invoice",
    blurb: "Clean bill for a product",
  },
  {
    id: "receipt",
    name: "Receipt",
    blurb: "Till slip",
  },
  {
    id: "voucher",
    name: "Voucher",
    blurb: "Ticket with a cut line",
  },
  {
    id: "display",
    name: "Display",
    blurb: "Large product photo",
  },
] as const;

export type LinkTemplateId = (typeof LINK_TEMPLATES)[number]["id"];

export const DEFAULT_LINK_TEMPLATE: LinkTemplateId = "display";

const TEMPLATE_IDS = new Set<string>(LINK_TEMPLATES.map((item) => item.id));

export function isLinkTemplateId(value: string): value is LinkTemplateId {
  return TEMPLATE_IDS.has(value);
}

export function normalizeLinkTemplate(value: unknown): LinkTemplateId {
  const id = String(value || "").trim();
  return isLinkTemplateId(id) ? id : DEFAULT_LINK_TEMPLATE;
}

export function linkTemplateMeta(value: unknown) {
  const id = normalizeLinkTemplate(value);
  return LINK_TEMPLATES.find((item) => item.id === id) ?? LINK_TEMPLATES[0];
}
