import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Lakeside Retreat collects, uses, and protects your personal information under the New Zealand Privacy Act 2020.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* Header */}
      <section className="py-20 px-5 pt-32 bg-white">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 className="font-display text-5xl mb-4">Privacy Policy</h1>
          <p className="text-muted">
            How we collect, use, and protect your personal information
          </p>
          <p className="text-muted text-sm mt-2">Last updated: Jun 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-5">
        <div className="max-w-[800px] mx-auto prose prose-lg text-body leading-8">
          <p>
            Lakeside Retreat operates at 96 Smiths Way, Mount Pisa, Cromwell 9383, New Zealand. We
            are committed to protecting your privacy in accordance with the New Zealand Privacy Act
            2020.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">1. Information We Collect</h2>
          <p>
            We collect your name, email address, phone number, postal address, and booking details
            (dates, preferences, guest count, special requirements) when you make a booking or
            enquiry.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">2. How We Use Your Information</h2>
          <ul>
            <li>Processing bookings and sending check-in instructions</li>
            <li>Responding to enquiries and communication</li>
            <li>Improving our services</li>
            <li>Legal compliance</li>
          </ul>
          <p>We will not use your information for marketing without your explicit consent.</p>

          <h2 className="font-display text-2xl mt-10 mb-4">3. Payment Processing</h2>
          <p>
            Payments are processed through <strong>Stripe</strong> (PCI-DSS Level 1 certified).
            Card details are entered directly into Stripe&apos;s secure form &mdash; Lakeside
            Retreat does not store your full card numbers or CVV. Security bond pre-authorisations
            are also processed through Stripe.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">4. Google Analytics</h2>
          <p>
            We use Google Analytics to understand how visitors use our website. This collects
            aggregated, anonymised data including pages visited, geographic location (country/region),
            browser type, and usage statistics. You can opt out via the{" "}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-burgundy"
            >
              Google Analytics Opt-out Browser Add-on
            </a>
            .
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">5. Cookies</h2>
          <p>
            We use essential cookies for website functionality and analytics cookies for Google
            Analytics. You can control cookies through your browser preferences.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">6. Data Sharing</h2>
          <p>
            We do not sell, trade, or rent your personal information. Data is shared only with:
          </p>
          <ul>
            <li>Stripe (payment processing)</li>
            <li>Google (anonymised analytics)</li>
            <li>Legal authorities (if required by law)</li>
          </ul>

          <h2 className="font-display text-2xl mt-10 mb-4">7. Data Retention</h2>
          <ul>
            <li>Booking records: up to 7 years (NZ tax law)</li>
            <li>Enquiry correspondence: up to 2 years</li>
            <li>Analytics data: anonymised after 14 months by Google</li>
          </ul>
          <p>You can request deletion, subject to our legal obligations.</p>

          <h2 className="font-display text-2xl mt-10 mb-4">
            8. Your Rights Under the NZ Privacy Act 2020
          </h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Complain to the Office of the Privacy Commissioner</li>
          </ul>
          <p>We will respond to requests within 20 working days.</p>

          <h2 className="font-display text-2xl mt-10 mb-4">9. Data Security</h2>
          <p>
            We protect your data with HTTPS encryption, PCI-DSS compliant Stripe infrastructure,
            limited access to authorised personnel, and regular security reviews.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">10. Contact Us</h2>
          <p>
            For privacy enquiries, contact us at{" "}
            <Link href="mailto:info@lakesideretreat.co.nz" className="text-burgundy">
              info@lakesideretreat.co.nz
            </Link>{" "}
            or write to 96 Smiths Way, Mount Pisa, Cromwell 9383, New Zealand.
          </p>
          <p>
            Office of the Privacy Commissioner:{" "}
            <a
              href="https://www.privacy.org.nz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-burgundy"
            >
              www.privacy.org.nz
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
