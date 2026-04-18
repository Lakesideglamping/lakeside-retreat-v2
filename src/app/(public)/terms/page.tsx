import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Lakeside Retreat terms and conditions covering bookings, cancellation, security bond, property rules, and guest responsibilities.",
};

export default function TermsConditionsPage() {
  return (
    <>
      {/* Header */}
      <section className="py-20 px-5 pt-32 bg-white">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 className="font-display text-5xl mb-4">Terms &amp; Conditions</h1>
          <p className="text-muted">
            Please read these terms carefully before making a booking
          </p>
          <p className="text-muted text-sm mt-2">Last updated: March 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-5">
        <div className="max-w-[800px] mx-auto prose prose-lg text-body leading-8">
          <p>
            These terms and conditions apply to all bookings at Lakeside Retreat,
            96 Smiths Way, Mount Pisa, Cromwell 9383, New Zealand.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">1. Bookings and Payment</h2>
          <ul>
            <li>
              Bookings are confirmed upon receipt of full payment or a valid
              pre-authorisation.
            </li>
            <li>
              All prices are in New Zealand Dollars (NZD) and include GST where
              applicable.
            </li>
            <li>
              Payment is processed securely through Stripe. We do not store your
              card details.
            </li>
            <li>
              A booking confirmation email will be sent to the email address
              provided.
            </li>
          </ul>

          <h2 className="font-display text-2xl mt-10 mb-4">
            2. Cancellation and Refund Policy
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-cream">
                  <th className="text-left p-3 font-semibold">Notice Period</th>
                  <th className="text-left p-3 font-semibold">Refund</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="p-3">7+ days before check-in</td>
                  <td className="p-3 text-burgundy font-semibold">100% refund</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-3">3&ndash;6 days before check-in</td>
                  <td className="p-3 text-burgundy font-semibold">50% refund</td>
                </tr>
                <tr>
                  <td className="p-3">Less than 3 days / no-show</td>
                  <td className="p-3 text-burgundy font-semibold">No refund</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Refunds are processed to the original payment method within 5&ndash;10
            business days.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">3. Security Bond</h2>
          <p>
            A $300 NZD security bond is pre-authorised on your card at check-in.
            This is not a charge &mdash; the hold is automatically released within
            7 days of checkout, provided no damage or excessive cleaning is
            required. If deductions are necessary, you will be notified with an
            itemised breakdown.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">
            4. Check-In and Check-Out
          </h2>
          <ul>
            <li>
              <strong>Check-in:</strong> 3:00 PM
            </li>
            <li>
              <strong>Check-out:</strong> 10:00 AM
            </li>
            <li>Early check-in or late check-out may be available on request.</li>
            <li>
              Self-check-in instructions are provided by email prior to arrival.
            </li>
          </ul>

          <h2 className="font-display text-2xl mt-10 mb-4">
            5. Accommodation Types and Guest Restrictions
          </h2>
          <h3 className="font-display text-xl mt-6 mb-3">
            Dome Pinot &amp; Dome Rosé (Adults Only)
          </h3>
          <ul>
            <li>Maximum 2 adult guests (18+ years)</li>
            <li>No children or infants permitted</li>
            <li>No pets permitted</li>
            <li>
              These accommodations are designed exclusively for couples and adult
              guests
            </li>
          </ul>
          <h3 className="font-display text-xl mt-6 mb-3">
            Lakeside Cottage (Pet Friendly)
          </h3>
          <ul>
            <li>Maximum 3 guests (2 base, 1 extra at $100/person/night)</li>
            <li>Well-behaved dogs welcome (maximum 2 dogs)</li>
            <li>Pets must not be left unattended in the property</li>
            <li>
              Pet owners are responsible for cleaning up after their animals
            </li>
          </ul>

          <h2 className="font-display text-2xl mt-10 mb-4">6. Property Rules</h2>
          <ul>
            <li>
              <strong>No smoking:</strong> All accommodations are strictly
              non-smoking, including vapes and e-cigarettes. A $500 cleaning fee
              applies for violations.
            </li>
            <li>
              <strong>Quiet hours:</strong> 10:00 PM &ndash; 7:00 AM. Please
              respect our neighbours and other guests.
            </li>
            <li>
              <strong>No parties or events:</strong> Our accommodations are for
              registered guests only. No unregistered visitors.
            </li>
            <li>
              <strong>Fire safety:</strong> No open fires. Use of BBQ facilities
              only as directed. Fire bans must be observed.
            </li>
            <li>
              <strong>Spa pools &amp; hot tub:</strong> Use at your own risk. Follow
              hygiene and safety guidelines provided. No glass near spa or hot tub
              areas. The cottage wood-fired hot tub must be operated per the
              instructions supplied.
            </li>
            <li>
              <strong>Lake access:</strong> Swimming and water activities are at
              your own risk. Children must be supervised at all times near water.
            </li>
          </ul>

          <h2 className="font-display text-2xl mt-10 mb-4">7. Maximum Occupancy</h2>
          <p>
            Guest numbers must not exceed the stated maximum for each
            accommodation. Additional guests beyond the booking are not permitted
            without prior arrangement and may result in cancellation of your
            booking without refund.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">
            8. Damage and Liability
          </h2>
          <ul>
            <li>
              Guests are responsible for any damage caused to the property,
              furnishings, or equipment during their stay.
            </li>
            <li>
              Damage costs exceeding the security bond will be charged to the card
              on file.
            </li>
            <li>
              Lakeside Retreat is not liable for loss or damage to guests&apos;
              personal property.
            </li>
            <li>
              Guests use all facilities (spa pool, lake access, BBQ) at
              their own risk.
            </li>
          </ul>

          <h2 className="font-display text-2xl mt-10 mb-4">9. Force Majeure</h2>
          <p>
            Lakeside Retreat is not liable for failure to perform obligations due
            to events beyond our reasonable control, including natural disasters,
            severe weather, pandemic, government restrictions, or utility failures.
            In such cases, we will offer alternative dates or a full refund.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">10. Privacy</h2>
          <p>
            Your personal information is handled in accordance with our{" "}
            <Link href="/privacy-policy" className="text-burgundy">
              Privacy Policy
            </Link>{" "}
            and the New Zealand Privacy Act 2020.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">
            11. Changes to These Terms
          </h2>
          <p>
            We may update these terms from time to time. The version in effect at
            the time of your booking applies to your stay. Material changes will be
            communicated to guests with existing bookings.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">12. Governing Law</h2>
          <p>
            These terms are governed by the laws of New Zealand. Any disputes will
            be subject to the exclusive jurisdiction of the New Zealand courts.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">13. Contact Us</h2>
          <p>
            For questions about these terms, contact us at{" "}
            <Link href="mailto:info@lakesideretreat.co.nz" className="text-burgundy">
              info@lakesideretreat.co.nz
            </Link>{" "}
            or write to 96 Smiths Way, Mount Pisa, Cromwell 9383, New Zealand.
          </p>
        </div>
      </section>
    </>
  );
}
