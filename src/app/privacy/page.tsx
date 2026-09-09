import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — SME Operations",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-blue/55">
        Legal
      </p>
      <h1 className="mt-3 font-serif text-3xl font-light tracking-tight text-primary-blue">
        Privacy Policy
      </h1>
      <p className="mt-2 font-sans text-sm text-muted-foreground">
        Last updated: 1 September 2026
      </p>

      <div className="mt-8 space-y-8 font-sans text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">1. Who we are</h2>
          <p>
            SME Operations is a platform that helps South African small and medium
            enterprises create online storefronts, manage products, and accept
            payments. References to &ldquo;we&rdquo;, &ldquo;us&rdquo; or
            &ldquo;our&rdquo; mean the SME Operations team operating this platform.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">
            2. Information we collect
          </h2>
          <p>We collect information you provide directly, including:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong className="text-foreground">Account information</strong> — full
              name, email address, and password (stored as a BCrypt hash; never in
              plain text).
            </li>
            <li>
              <strong className="text-foreground">Business information</strong> —
              business name, description, and the public storefront you configure.
            </li>
            <li>
              <strong className="text-foreground">Payment settings</strong> — bank
              account details you supply to receive payouts via Paystack. We do not
              store card numbers.
            </li>
            <li>
              <strong className="text-foreground">Order data</strong> — customer
              names, email addresses, phone numbers, and shipping addresses submitted
              by your customers when they place orders on your storefront.
            </li>
            <li>
              <strong className="text-foreground">Usage data</strong> — IP addresses,
              browser user-agent strings, and request timestamps recorded in security
              audit logs.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">
            3. How we use your information
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>To create and manage your merchant account.</li>
            <li>To operate your public storefront and process customer orders.</li>
            <li>To send transactional emails (email verification, order confirmations, low-stock alerts).</li>
            <li>To detect and prevent fraud, abuse, and unauthorised access.</li>
            <li>To provide aggregated analytics on your store performance.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">
            4. POPIA — Protection of Personal Information
          </h2>
          <p>
            We process personal information in accordance with the Protection of
            Personal Information Act, 4 of 2013 (POPIA). Our lawful basis for
            processing is the performance of the contract between you and SME
            Operations, and the legitimate interest of providing a secure,
            functional service.
          </p>
          <p className="mt-2">
            You have the right to access, correct, or request deletion of your
            personal information. To exercise these rights, contact us at the address
            below.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">
            5. Data sharing
          </h2>
          <p>
            We do not sell your personal information. We share data only with the
            service providers required to operate the platform:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong className="text-foreground">Paystack</strong> — payment
              processing and subaccount management.
            </li>
            <li>
              <strong className="text-foreground">Amazon Web Services (SES, S3)</strong>{" "}
              — transactional email delivery and media file storage.
            </li>
            <li>
              <strong className="text-foreground">Microsoft Azure</strong> — cloud
              hosting for the application and database.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">6. Data retention</h2>
          <p>
            Merchant accounts and associated data are retained for as long as the
            account is active. Soft-deleted accounts are retained for 90 days before
            permanent removal. Order records are retained for seven years to satisfy
            financial record-keeping requirements.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">7. Security</h2>
          <p>
            Passwords are hashed with BCrypt (strength 12). API access requires
            signed JWT tokens with a 24-hour expiry. All connections use HTTPS/TLS.
            Database credentials and API keys are never exposed in source code.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-primary-blue">8. Contact</h2>
          <p>
            For privacy-related questions or to exercise your POPIA rights, contact
            the SME Operations team via the University of Johannesburg Applied
            Information Systems department.
          </p>
        </section>
      </div>
    </div>
  );
}
