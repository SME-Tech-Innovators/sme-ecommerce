import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — SME Operations",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-blue/55">
        Legal
      </p>
      <h1 className="mt-3 font-serif text-3xl font-light tracking-tight text-primary-blue">
        Terms of Use
      </h1>
      <p className="mt-2 font-sans text-sm text-muted-foreground">
        Last updated: 1 September 2026
      </p>

      <div className="mt-8 space-y-8 font-sans text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">
            1. Acceptance of terms
          </h2>
          <p>
            By creating an account or using the SME Operations platform, you agree
            to these Terms of Use. If you do not agree, do not use the platform.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">
            2. Description of service
          </h2>
          <p>
            SME Operations provides South African small and medium enterprises with
            tools to create an online storefront, list products, accept payments via
            Paystack, and manage orders. The platform is provided as a software
            service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">
            3. Merchant responsibilities
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              You are responsible for the accuracy of product listings, pricing, and
              stock information published on your storefront.
            </li>
            <li>
              You must comply with all applicable South African laws, including the
              Consumer Protection Act and tax obligations.
            </li>
            <li>
              You may not use the platform to sell illegal goods or services, or to
              engage in fraudulent activity.
            </li>
            <li>
              You are responsible for fulfilling orders placed on your storefront and
              for resolving customer disputes.
            </li>
            <li>
              You must keep your account credentials confidential and notify us
              immediately of any unauthorised access.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">4. Payments</h2>
          <p>
            Payments are processed by Paystack. By connecting a payout account, you
            agree to Paystack&apos;s terms of service. SME Operations does not store
            card numbers or full bank account credentials. Payout timing and
            settlement are governed by Paystack&apos;s policies.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">
            5. Intellectual property
          </h2>
          <p>
            You retain ownership of the content you upload (product images,
            descriptions, storefront copy). By uploading content, you grant SME
            Operations a non-exclusive licence to store and display that content to
            operate the service.
          </p>
          <p className="mt-2">
            The SME Operations platform, including its software, design, and
            documentation, is the intellectual property of the development team.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">
            6. Limitation of liability
          </h2>
          <p>
            The platform is provided &ldquo;as is&rdquo; without warranties of any
            kind. SME Operations is not liable for loss of revenue, data, or
            business arising from service interruptions, payment failures, or errors
            in the platform.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">
            7. Account termination
          </h2>
          <p>
            You may delete your account at any time from the account settings. We
            reserve the right to suspend or terminate accounts that violate these
            terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">
            8. Changes to these terms
          </h2>
          <p>
            We may update these terms from time to time. Continued use of the
            platform after changes are published constitutes acceptance of the
            updated terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">
            9. Governing law
          </h2>
          <p>
            These terms are governed by the laws of the Republic of South Africa.
            Any disputes shall be subject to the jurisdiction of South African
            courts.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">10. Contact</h2>
          <p>
            For questions about these terms, contact the SME Operations team via the
            University of Johannesburg Applied Information Systems department.
          </p>
        </section>
      </div>
    </div>
  );
}
