import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { HeroBackground } from "@/components/hero-background";
import { JsonLd, createContactPageSchema, createBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Contact Lakeside Retreat | Cromwell, Central Otago",
  description:
    "Get in touch with Lakeside Retreat in Cromwell, Central Otago. Enquiries, availability, and bookings for luxury glamping domes and lakeside cottage. Call or email Steve and Sandy.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Lakeside Retreat",
    description:
      "Enquiries, availability, and bookings for luxury glamping domes and lakeside cottage in Cromwell, Central Otago.",
    url: "https://lakesideretreat.co.nz/contact",
    images: [{ url: "/images/StBathern.jpeg", width: 1200, height: 800, alt: "Lakeside Retreat" }],
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
        src="/images/StBathern.jpeg"
        alt="Glamping domes with mountain views at Lakeside Retreat"
        minHeight="50vh"
      >
        <h1 className="font-display text-5xl text-white mb-4">Contact Us</h1>
        <p className="text-xl opacity-95">
          Ask us anything. Steve and Sandy reply personally.
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
                personal service from your hosts Steve and Sandy.
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
          {/* Google's canonical embed URL. Keeps the responsive classes rather
              than the width/height attributes Google's snippet ships with —
              those are a fixed 600x450 and would break the layout on a phone. */}
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2823.7887635365296!2d169.26591987675795!3d-44.94796197107016!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xa82ad2797295e4e9%3A0x7a0b7850e16c8aee!2s96%20Smiths%20Way%2C%20Cromwell%2C%20Mount%20Pisa%209383%2C%20New%20Zealand!5e0!3m2!1sen!2sau!4v1789638265926!5m2!1sen!2sau"
            className="w-full h-[400px] rounded-xl border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            title="Lakeside Retreat location on Google Maps"
          />
        </div>
      </section>
    </>
  );
}
