import type { Metadata } from "next";
import { Container } from "@/components/marketing/container";
import { SITE_OG_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How LBPay collects, uses, stores, protects, and shares personal and transaction information.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "LBPay Privacy Policy",
    description:
      "How LBPay collects, uses, stores, protects, and shares personal and transaction information.",
    url: "/privacy",
    images: [SITE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "LBPay Privacy Policy",
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

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-paper py-12 md:py-16">
      <Container className="max-w-4xl">
        <article className="rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(10,37,64,0.04)] md:p-10">
          <header className="space-y-3 border-b border-line pb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">Privacy Policy</h1>
            <p className="text-sm text-muted">Last Updated: September 7, 2026</p>
            <p className="text-[15px] leading-7 text-[#3c4257]">
              LBPay ("LBPay", "we", "us", or "our") respects your privacy and is committed to
              protecting the personal and financial information entrusted to us.
            </p>
            <p className="text-[15px] leading-7 text-[#3c4257]">
              This Privacy Policy explains how LBPay collects, uses, stores, protects, and shares
              information when you access or use the LBPay website, applications, APIs, merchant
              dashboard, payment services, wallet services, and related products and services
              (collectively, the "Services").
            </p>
            <p className="text-[15px] leading-7 text-[#3c4257]">
              By using LBPay, you acknowledge that you have read and understood this Privacy
              Policy.
            </p>
          </header>

          <div className="mt-8 space-y-8">
            <Section title="1. Information We Collect">
              <p>
                Depending on how you use LBPay, we may collect the following categories of
                information:
              </p>
              <h3 className="pt-1 text-lg font-semibold text-ink">1.1 Account Information</h3>
              <p>When you create an LBPay account, we may collect:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Full name</li>
                <li>Email address</li>
                <li>Telephone number</li>
                <li>Username</li>
                <li>Password credentials or authentication information</li>
                <li>Business information</li>
                <li>Account preferences</li>
                <li>Profile information</li>
              </ul>
              <h3 className="pt-1 text-lg font-semibold text-ink">1.2 Transaction Information</h3>
              <p>
                When you use LBPay to send, receive, collect, or process payments, we may collect
                information relating to:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Transaction amounts</li>
                <li>Transaction dates and times</li>
                <li>Transaction references</li>
                <li>Payment status</li>
                <li>Sender and recipient information</li>
                <li>Merchant information</li>
                <li>Payment method</li>
                <li>Currency</li>
                <li>Transaction history</li>
                <li>Payment-related metadata</li>
              </ul>
              <p>
                LBPay does not needlessly collect or retain complete payment-card information when
                such information is processed directly by an authorized third-party payment
                processor.
              </p>
              <h3 className="pt-1 text-lg font-semibold text-ink">
                1.3 Verification and Compliance Information
              </h3>
              <p>
                Where required for security, fraud prevention, regulatory compliance, or merchant
                onboarding, we may collect information such as:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Identity information</li>
                <li>Business registration information</li>
                <li>Tax information</li>
                <li>Proof of address</li>
                <li>Verification documents</li>
                <li>Beneficial ownership information</li>
                <li>
                  Other information reasonably required for KYC, AML, fraud prevention, or
                  compliance purposes
                </li>
              </ul>
              <h3 className="pt-1 text-lg font-semibold text-ink">1.4 Technical Information</h3>
              <p>When you access our Services, we may automatically collect:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>IP address</li>
                <li>Browser type</li>
                <li>Device type</li>
                <li>Operating system</li>
                <li>Device identifiers</li>
                <li>Login information</li>
                <li>Approximate location derived from technical information</li>
                <li>Pages and features accessed</li>
                <li>Referring URLs</li>
                <li>Error logs</li>
                <li>Security and authentication logs</li>
              </ul>
              <h3 className="pt-1 text-lg font-semibold text-ink">
                1.5 Cookies and Similar Technologies
              </h3>
              <p>LBPay may use cookies and similar technologies to:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Keep you signed in</li>
                <li>Maintain security</li>
                <li>Remember preferences</li>
                <li>Understand how users interact with our Services</li>
                <li>Improve performance and reliability</li>
                <li>Detect suspicious or fraudulent activity</li>
              </ul>
              <p>You may be able to control cookies through your browser settings.</p>
            </Section>

            <Section title="2. How We Use Your Information">
              <p>We may use information collected through LBPay to:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Create and manage accounts</li>
                <li>Provide payment and financial technology services</li>
                <li>Process and record transactions</li>
                <li>Provide customer support</li>
                <li>Verify identities and businesses</li>
                <li>Prevent fraud and unauthorized transactions</li>
                <li>Detect suspicious activity</li>
                <li>Maintain platform security</li>
                <li>Improve our Services</li>
                <li>Communicate with users about their accounts and transactions</li>
                <li>Send important service notifications</li>
                <li>Comply with applicable laws and regulatory requirements</li>
                <li>Enforce our Terms of Service</li>
                <li>Resolve disputes</li>
                <li>
                  Protect the rights, property, and safety of LBPay, our users, and third parties
                </li>
              </ul>
              <p>
                We will not use personal information for purposes materially incompatible with those
                described in this Privacy Policy without appropriate notice or legal basis.
              </p>
            </Section>

            <Section title="3. How We Share Information">
              <p>
                We may share information with trusted third parties when necessary to operate LBPay.
              </p>
              <p>These may include:</p>
              <h3 className="pt-1 text-lg font-semibold text-ink">Payment and Financial Partners</h3>
              <p>
                Information may be shared with payment processors, banks, mobile money operators,
                card networks, financial institutions, and other payment partners when necessary to
                process or complete transactions.
              </p>
              <h3 className="pt-1 text-lg font-semibold text-ink">Technology Providers</h3>
              <p>We may use third-party providers for:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Cloud hosting</li>
                <li>Database infrastructure</li>
                <li>Authentication</li>
                <li>Email delivery</li>
                <li>SMS delivery</li>
                <li>Analytics</li>
                <li>Fraud detection</li>
                <li>Security monitoring</li>
                <li>Customer support</li>
                <li>Payment processing</li>
              </ul>
              <p>
                These providers may process information on our behalf and are expected to maintain
                appropriate security and confidentiality.
              </p>
              <h3 className="pt-1 text-lg font-semibold text-ink">
                Legal and Regulatory Authorities
              </h3>
              <p>
                We may disclose information when required by applicable law, court order,
                regulatory requirement, or lawful governmental request.
              </p>
              <p>
                We may also disclose information where reasonably necessary to investigate fraud,
                financial crime, security incidents, or violations of our Terms.
              </p>
            </Section>

            <Section title="4. Data Security">
              <p>
                LBPay uses reasonable technical and organizational measures designed to protect
                information against unauthorized access, alteration, disclosure, loss, or
                destruction.
              </p>
              <p>Security measures may include:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Encryption in transit</li>
                <li>Secure authentication</li>
                <li>Access controls</li>
                <li>Role-based permissions</li>
                <li>Security logging</li>
                <li>Monitoring for suspicious activity</li>
                <li>Secure infrastructure</li>
                <li>Regular software and security updates</li>
                <li>Backup and recovery procedures</li>
              </ul>
              <p>However, no internet-based service can guarantee absolute security.</p>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials
                and should immediately notify LBPay if you believe your account has been
                compromised.
              </p>
            </Section>

            <Section title="5. Data Retention">
              <p>
                We retain personal and transaction information for as long as reasonably necessary
                to:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Provide our Services</li>
                <li>Maintain business and transaction records</li>
                <li>Prevent fraud</li>
                <li>Resolve disputes</li>
                <li>Meet legal and regulatory obligations</li>
                <li>Enforce agreements</li>
                <li>Protect our legitimate interests</li>
              </ul>
              <p>
                Retention periods may vary depending on the type of information and applicable
                legal requirements.
              </p>
            </Section>

            <Section title="6. International Data Processing">
              <p>
                LBPay may use service providers located in countries other than the country where
                you live.
              </p>
              <p>
                Where personal information is transferred internationally, LBPay will take
                reasonable steps to ensure that the information receives appropriate protection
                consistent with applicable law.
              </p>
            </Section>

            <Section title="7. Your Privacy Rights">
              <p>
                Depending on applicable law, you may have rights regarding your personal
                information, including the right to:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Request access to personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of information where legally permitted</li>
                <li>Request restriction of certain processing</li>
                <li>Object to certain uses of your information</li>
                <li>Withdraw consent where processing is based on consent</li>
                <li>Request a copy of certain information</li>
              </ul>
              <p>
                Some requests may be subject to legal, security, fraud-prevention, or
                financial-record retention requirements.
              </p>
              <p>
                To exercise an applicable privacy right, contact us using the contact information
                provided below.
              </p>
            </Section>

            <Section title="8. Children's Privacy">
              <p>
                LBPay is not intended for individuals who are below the minimum age required to
                legally use our Services.
              </p>
              <p>
                We do not knowingly collect personal information from children where prohibited by
                applicable law.
              </p>
            </Section>

            <Section title="9. Third-Party Services">
              <p>
                LBPay may contain integrations, links, APIs, or services provided by third
                parties.
              </p>
              <p>
                Third-party services operate under their own privacy policies and terms. LBPay is
                not responsible for the privacy practices of third-party services that it does not
                control.
              </p>
            </Section>

            <Section title="10. Changes to This Privacy Policy">
              <p>
                We may update this Privacy Policy from time to time to reflect changes to our
                Services, technology, legal requirements, or business practices.
              </p>
              <p>When we make material changes, we may provide additional notice where appropriate.</p>
              <p>
                The "Last Updated" date at the top of this Policy indicates when it was most
                recently revised.
              </p>
            </Section>

            <Section title="11. Contact Us">
              <p>
                If you have questions about this Privacy Policy or want to make a privacy-related
                request, please contact LBPay through the official contact channels provided on our
                website.
              </p>
              <p>
                <strong>LBPay</strong>
                <br />A product of <strong>Looping Binary</strong>
              </p>
              <p>
                Email: loopingbinary@gmail.com
                <br />Website: https://lbpay.loopingbinary.com
              </p>
            </Section>

            <p className="border-t border-line pt-6 text-sm leading-6 text-muted">
              This Privacy Policy is intended to provide general information about LBPay&apos;s data
              practices and should be reviewed and adapted to the laws and regulatory requirements
              applicable to LBPay&apos;s actual operations.
            </p>
          </div>
        </article>
      </Container>
    </div>
  );
}