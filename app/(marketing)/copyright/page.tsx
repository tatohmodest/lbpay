import type { Metadata } from "next";
import { Container } from "@/components/marketing/container";
import { SITE_OG_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Copyright & Intellectual Property Policy",
  description:
    "LBPay policy on intellectual property ownership, permitted use, and copyright complaints.",
  alternates: { canonical: "/copyright" },
  openGraph: {
    title: "LBPay Copyright & Intellectual Property Policy",
    description:
      "LBPay policy on intellectual property ownership, permitted use, and copyright complaints.",
    url: "/copyright",
    images: [SITE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "LBPay Copyright & Intellectual Property Policy",
    images: [SITE_OG_IMAGE.url],
  },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">{title}</h2>
      <div className="space-y-3 text-[15px] leading-7 text-[#3c4257]">{children}</div>
    </section>
  );
}

export default function CopyrightPolicyPage() {
  return (
    <div className="bg-paper py-12 md:py-16">
      <Container className="max-w-4xl">
        <article className="rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(10,37,64,0.04)] md:p-10">
          <header className="space-y-3 border-b border-line pb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
              Copyright &amp; Intellectual Property Policy
            </h1>
            <p className="text-sm text-muted">Last Updated: September 7, 2026</p>
            <p className="text-[15px] leading-7 text-[#3c4257]">
              LBPay and Looping Binary respect intellectual property rights and expect all users
              of the LBPay Services to do the same.
            </p>
            <p className="text-[15px] leading-7 text-[#3c4257]">
              This policy explains the ownership of intellectual property associated with LBPay
              and the process for reporting material that you believe infringes your copyright or
              other intellectual property rights.
            </p>
          </header>

          <div className="mt-8 space-y-8">
            <Section title="1. LBPay Intellectual Property">
              <p>
                Unless otherwise stated, the following materials are owned by or licensed to LBPay
                or Looping Binary:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>LBPay name and branding</li>
                <li>LBPay logos and trademarks</li>
                <li>Website design</li>
                <li>User interface and user experience designs</li>
                <li>Source code</li>
                <li>Software</li>
                <li>Documentation</li>
                <li>API documentation</li>
                <li>Graphics</li>
                <li>Icons</li>
                <li>Images</li>
                <li>Videos</li>
                <li>Written content</li>
                <li>Product descriptions</li>
                <li>Marketing materials</li>
                <li>Database structures</li>
                <li>Platform architecture</li>
                <li>Original designs and visual elements</li>
              </ul>
              <p>
                These materials are protected by applicable copyright, trademark, intellectual
                property, and other laws.
              </p>
            </Section>

            <Section title="2. Restrictions on Use">
              <p>Unless LBPay provides written permission, you may not:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Copy substantial portions of LBPay&apos;s website or software</li>
                <li>Reproduce LBPay&apos;s branding or logo</li>
                <li>
                  Modify, distribute, sell, sublicense, or commercially exploit LBPay proprietary
                  materials
                </li>
                <li>
                  Reverse engineer or attempt to extract source code where prohibited by law
                </li>
                <li>
                  Create a competing service by copying substantial proprietary elements of LBPay
                </li>
                <li>Remove copyright, trademark, or proprietary notices</li>
                <li>
                  Use LBPay branding in a way that suggests unauthorized affiliation or endorsement
                </li>
              </ul>
              <p>
                Using LBPay&apos;s Services does not transfer ownership of LBPay&apos;s intellectual
                property to you.
              </p>
            </Section>

            <Section title="3. User Content">
              <p>
                If users are permitted to upload, submit, publish, or otherwise provide content
                through LBPay, users remain responsible for ensuring that they have the necessary
                rights and permissions to use that content.
              </p>
              <p>You must not upload or submit material that:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Infringes another person&apos;s copyright</li>
                <li>Violates trademark rights</li>
                <li>Violates intellectual property rights</li>
                <li>Contains unlawful material</li>
                <li>You do not have permission to use</li>
              </ul>
              <p>
                By submitting content to LBPay, you represent that you have the necessary rights to
                provide that content.
              </p>
            </Section>

            <Section title="4. Reporting Copyright Infringement">
              <p>
                If you believe that content available through LBPay infringes your copyright, you
                may submit a written copyright complaint.
              </p>
              <p>Your complaint should include:</p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Your full name or the name of the copyright owner.</li>
                <li>Contact information through which you can be reached.</li>
                <li>Identification of the copyrighted work you believe has been infringed.</li>
                <li>A description of the material you believe is infringing.</li>
                <li>
                  The location or URL where the allegedly infringing material can be found.
                </li>
                <li>
                  A statement that you have a good-faith belief that the use is not authorized by
                  the copyright owner, its agent, or applicable law.
                </li>
                <li>A statement confirming that the information provided is accurate.</li>
                <li>
                  Confirmation that you are the copyright owner or authorized to act on behalf of
                  the copyright owner.
                </li>
                <li>Your physical or electronic signature.</li>
              </ol>
            </Section>

            <Section title="5. Review and Removal">
              <p>
                Upon receiving a sufficiently detailed complaint, LBPay may investigate the reported
                material.
              </p>
              <p>Where appropriate and legally permitted, LBPay may:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Remove or restrict access to the reported material</li>
                <li>Contact the relevant user</li>
                <li>Request additional information</li>
                <li>Temporarily restrict access to an account</li>
                <li>Take other appropriate action</li>
              </ul>
              <p>LBPay does not guarantee that every complaint will result in removal.</p>
            </Section>

            <Section title="6. Repeat Infringement">
              <p>
                LBPay may suspend or terminate accounts that repeatedly infringe the intellectual
                property rights of others.
              </p>
              <p>The action taken will depend on the circumstances and applicable law.</p>
            </Section>

            <Section title="7. False Claims">
              <p>Copyright complaints must be made in good faith.</p>
              <p>
                Knowingly submitting false or misleading copyright complaints may result in
                appropriate action and may expose the person submitting the complaint to legal
                consequences.
              </p>
            </Section>

            <Section title="8. Trademarks">
              <p>
                LBPay, the LBPay logo, Looping Binary, and associated names, logos, designs, and
                marks may constitute trademarks or other protected identifiers.
              </p>
              <p>
                You may not use LBPay or Looping Binary trademarks in a manner that falsely
                suggests sponsorship, partnership, endorsement, or affiliation without written
                authorization.
              </p>
            </Section>

            <Section title="9. Contact">
              <p>Copyright and intellectual property complaints should be sent to:</p>
              <p>
                <strong>LBPay / Looping Binary</strong>
                <br />Copyright Contact: [INSERT COPYRIGHT EMAIL]
              </p>
              <p>
                Subject: <strong>Copyright Infringement Notice</strong>
              </p>
              <p>We may request additional information where necessary to investigate a complaint.</p>
            </Section>

            <p className="border-t border-line pt-6 text-sm leading-6 text-muted">
              This policy does not constitute legal advice and may be updated as LBPay&apos;s Services
              and applicable legal requirements develop.
            </p>
          </div>
        </article>
      </Container>
    </div>
  );
}