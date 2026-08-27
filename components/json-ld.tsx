import { SITE_DESCRIPTION, SITE_FAQS, SITE_NAME, SITE_URL } from "@/lib/site";

const orgId = `${SITE_URL}/#organization`;
const siteId = `${SITE_URL}/#website`;

function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function SiteJsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/illustrations/lbpay-mark.png`,
        description: SITE_DESCRIPTION,
        areaServed: { "@type": "Country", name: "Cameroon" },
        knowsAbout: [
          "Mobile Money",
          "MTN Mobile Money",
          "Orange Money",
          "XAF payments",
          "Payment APIs",
        ],
      },
      {
        "@type": "WebSite",
        "@id": siteId,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        publisher: { "@id": orgId },
        inLanguage: "en",
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "FinanceApplication",
        operatingSystem: "iOS, Android, Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "XAF" },
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        publisher: { "@id": orgId },
      },
    ],
  };

  return <JsonLdScript data={graph} />;
}

export function FaqJsonLd() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: SITE_FAQS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }}
    />
  );
}
