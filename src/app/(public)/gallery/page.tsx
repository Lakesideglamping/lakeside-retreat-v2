import type { Metadata } from "next";
import { GalleryContent } from "@/components/gallery-content";

export const metadata: Metadata = {
  title: "Photo Gallery",
  description:
    "Photos of luxury glamping domes, Lake Dunstan views and Central Otago scenery at Lakeside Retreat. Rated 4.9 stars by 127 guests.",
};

export default function GalleryPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative min-h-[50vh] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/images/dome-pinot-hero.jpeg')",
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
