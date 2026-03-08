"use client";

import Image from "next/image";
import { useState } from "react";

const categories = ["all", "domes", "cottage", "views", "amenities"] as const;
type Category = (typeof categories)[number];

const categoryLabels: Record<Category, string> = {
  all: "All Photos",
  domes: "Glamping Domes",
  cottage: "Lakeside Cottage",
  views: "Lake & Views",
  amenities: "Amenities",
};

const galleryItems = [
  { src: "/images/dome-pinot-hero.jpeg", alt: "Dome Pinot exterior with panoramic Lake Dunstan views at sunset", title: "Dome Pinot Exterior", category: "domes" as Category },
  { src: "/images/dome-rose-spa1.jpeg", alt: "Dome Rose with private spa pool and vineyard views", title: "Dome Ros\u00e9 & Spa", category: "domes" as Category },
  { src: "/images/lakeside-cottage-exterior.jpeg", alt: "Lakeside Cottage with direct Lake Dunstan access", title: "Lakeside Cottage", category: "cottage" as Category },
  { src: "/images/vineyard.jpeg", alt: "Central Otago vineyard views from Lakeside Retreat", title: "Vineyard Views", category: "views" as Category },
  { src: "/images/magical-sunset.jpg", alt: "Stunning sunset over Lake Dunstan", title: "Lake Dunstan Sunset", category: "views" as Category },
  { src: "/images/pinotspa.jpeg", alt: "Private hot tub under the stars", title: "Hot Tub Experience", category: "amenities" as Category },
  { src: "/images/dome-rose-interior.jpeg", alt: "Luxurious dome interior with king bed and panoramic windows", title: "Dome Interior", category: "domes" as Category },
  { src: "/images/domesmountainview.jpeg", alt: "Mountain views from the property", title: "Mountain Panorama", category: "views" as Category },
  { src: "/images/gallerydeck.jpeg", alt: "Relaxing on the deck with vineyard views", title: "Your Private Retreat", category: "amenities" as Category },
];

export function GalleryContent() {
  const [filter, setFilter] = useState<Category>("all");
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const filtered = filter === "all" ? galleryItems : galleryItems.filter((i) => i.category === filter);

  return (
    <>
      {/* Filters */}
      <div className="flex justify-center gap-3 mb-8 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-6 py-3 rounded-full border-2 border-teal font-medium transition-all cursor-pointer ${
              filter === cat
                ? "bg-teal text-white"
                : "bg-transparent text-teal hover:bg-teal hover:text-white"
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <button
            key={item.src}
            onClick={() => setLightbox({ src: item.src, alt: item.alt })}
            className="group relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer border-0 p-0 bg-transparent"
          >
            <Image
              src={item.src}
              alt={item.alt}
              width={800}
              height={600}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <div className="font-semibold">{item.title}</div>
              <div className="text-sm text-burgundy">{categoryLabels[item.category]}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-8 text-white text-4xl cursor-pointer bg-transparent border-0"
            aria-label="Close lightbox"
          >
            &times;
          </button>
          <Image
            src={lightbox.src}
            alt={lightbox.alt}
            width={1600}
            height={1200}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
