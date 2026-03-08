import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Lakeside Retreat in Cromwell, Central Otago. Enquiries, bookings, and availability for luxury glamping domes and lakefront cottage.",
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
      {/* Hero */}
      <section
        className="relative min-h-[50vh] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/images/domesmountainview.jpeg')",
        }}
      >
        <div className="pt-20 px-5">
          <h1 className="font-display text-5xl text-white mb-4">Contact Us</h1>
          <p className="text-xl opacity-95">
            We&apos;d love to hear from you. Get in touch for bookings, enquiries, or just to say hello.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="font-display text-3xl mb-8">Get in Touch</h2>
            <div className="space-y-6 mb-8">
              {contactInfo.map((item) => (
                <div key={item.label}>
                  <h3 className="font-semibold text-teal mb-1">{item.label}</h3>
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
            <form className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-1">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                >
                  <option value="booking">Booking Enquiry</option>
                  <option value="availability">Availability Check</option>
                  <option value="special">Special Request</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">
                  Your Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell us about your travel dates, questions, or any special requirements..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal resize-y"
                />
              </div>
              <Button href="/#booking">Send Message</Button>
            </form>
          </div>
        </div>

        {/* Map */}
        <div className="max-w-[1200px] mx-auto mt-16">
          <iframe
            src="https://maps.google.com/maps?q=-45.038710,169.197693&z=14&output=embed"
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
