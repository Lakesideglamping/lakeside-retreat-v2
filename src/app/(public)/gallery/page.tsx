import type { Metadata } from "next";
import { GalleryContent } from "@/components/gallery-content";
import { JsonLd, createBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Photo Gallery | Luxury Glamping Domes & Cottage, Central Otago",
  description:
    "Photos of Lakeside Retreat: luxury geodesic domes, private outdoor spas, Lake Dunstan views, and Central Otago landscapes. 4.9★ rated accommodation, Cromwell.",
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: "Photo Gallery | Lakeside Retreat",
    description:
      "Photos of Lakeside Retreat: luxury geodesic domes, private spas, Lake Dunstan views, Central Otago.",
    url: "https://lakesideretreat.co.nz/gallery",
    images: [{ url: "/images/domes-vineyard-sunset.jpg", width: 1200, height: 800, alt: "Lakeside Retreat gallery" }],
    type: "website",
  },
};

export default function GalleryPage() {
  return (
    <>
      <JsonLd data={[
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Gallery", path: "/gallery" },
        ]),
      ]} />
      {/* Hero */}
      <section
        className="relative min-h-[50vh] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/images/domes-vineyard-sunset.jpg')",
        }}
      >
        <div className="pt-20">
          <h1 className="font-display text-5xl text-white mb-4">Photo Gallery</h1>
          <p className="text-xl opacity-95 max-w-[600px] mx-auto px-5">
            Explore our luxury accommodations, stunning lake views, and the beauty of Central Otago
          </p>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20 px-5">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-4">
            Discover Lakeside Retreat
          </h2>
          <p className="text-center text-muted text-lg mb-8">
            Browse photos of our accommodations, surroundings, and guest experiences
          </p>
          <GalleryContent />
        </div>
      </section>
    </>
  );
}
