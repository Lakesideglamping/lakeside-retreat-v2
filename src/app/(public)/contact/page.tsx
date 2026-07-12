import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { HeroBackground } from "@/components/hero-background";
import { JsonLd, createContactPageSchema, createBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Contact Lakeside Retreat | Cromwell, Central Otago",
  description:
    "Get in touch with Lakeside Retreat in Cromwell, Central Otago. Enquiries, availability, and bookings for luxury glamping domes and lakeside cottage. Call or email Stephen & Sandy.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Lakeside Retreat",
    description:
      "Enquiries, availability, and bookings for luxury glamping domes and lakeside cottage in Cromwell, Central Otago.",
    url: "https://lakesideretreat.co.nz/contact",
    images: [{ url: "/images/WinterVineyard.jpeg", width: 1200, height: 800, alt: "Lakeside Retreat" }],
    type: "website",
  },
};

const contactInfo = [
  { label: "Address", value: "96 Smiths Way, Mount Pisa\nCromwell 9383\nCentral Otago, New Zealand" },
  { label: "Phone", value: "+64 21 368 682", href: "tel:+6421368682" },
  { label: "Email", value: "info@lakesideretreat.co.nz", href: "mailto:info@lakesideretreat.co.nz" },
  { label: "Check-in / Check-out", value: "Check-in: 3:00 PM\nCheck-out: 10:00 AM" },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd data={[
        createContactPageSchema(),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ]),
      ]} />
      {/* Hero */}
      <HeroBackground
        src="/images/WinterVineyard.jpeg"
        alt="Glamping domes with mountain views at Lakeside Retreat"
        minHeight="50vh"
      >
        <h1 className="font-display text-5xl text-white mb-4">Contact Us</h1>
        <p className="text-xl opacity-95">
          Ask us anything. Stephen and Sandy reply personally.
        </p>
      </HeroBackground>

      {/* Content */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="font-display text-3xl mb-8">Get in Touch</h2>
            <div className="space-y-6 mb-8">
              {contactInfo.map((item) => (
                <div key={item.label}>
                  <h3 className="font-semibold text-burgundy mb-1">{item.label}</h3>
                  {item.href ? (
                    <Link href={item.href} className="text-burgundy no-underline hover:underline">
                      {item.value}
                    </Link>
                  ) : (
                    <p className="text-muted whitespace-pre-line m-0">{item.value}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-cream rounded-xl p-6">
              <h4 className="font-display text-lg mb-2">Book Direct for Best Rates</h4>
              <p className="text-muted text-sm m-0">
                When you book directly with us, you&apos;ll get the best available rates plus
                personal service from your hosts Stephen and Sandy.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="font-display text-3xl mb-8">Send Us a Message</h2>
            <ContactForm />
          </div>
        </div>

        {/* Map */}
        <div className="max-w-[1200px] mx-auto mt-16">
          <iframe
            src="https://maps.google.com/maps?q=-44.947962,169.2659199&z=14&output=embed"
            className="w-full h-[400px] rounded-xl border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Lakeside Retreat location on Google Maps"
          />
        </div>
      </section>
    </>
  );
}
