"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

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
  { src: "/images/domes-portrait-lake.jpg", alt: "Both geodesic domes with vineyard rows leading to Lake Dunstan", title: "Vineyard & Lake", category: "domes" as Category },
  { src: "/images/hottub-lakeview.jpg", alt: "Wood-fired cedar hot tub with Lake Dunstan and mountain backdrop", title: "Cedar Hot Tub", category: "amenities" as Category },
  { src: "/images/domes-vineyard-sunset.jpg", alt: "Both glamping domes at Lakeside Retreat with Lake Dunstan and sunset sky", title: "Domes at Sunset", category: "domes" as Category },
  { src: "/images/Pinotfront.jpeg", alt: "Dome Pinot exterior with snow-capped mountain views", title: "Dome Pinot Exterior", category: "domes" as Category },
  { src: "/images/dome-rose-spa1.jpeg", alt: "Dome Rosé nestled in golden autumn vineyard by the lake", title: "Dome Rosé in Autumn", category: "domes" as Category },
  { src: "/images/IMG_1266-1920x1080.jpeg", alt: "Both domes in winter vineyard with snow-capped mountains", title: "Winter at Lakeside", category: "domes" as Category },
  { src: "/images/lakeside-cottage-exterior.jpeg", alt: "Lakeside Cottage with direct Lake Dunstan access", title: "Lakeside Cottage", category: "cottage" as Category },
  { src: "/images/cottagebedroom.jpeg", alt: "Lakeside Cottage bedroom with mountain views", title: "Cottage Bedroom", category: "cottage" as Category },
  { src: "/images/galleryrainbow.jpeg", alt: "Full rainbow over Lake Dunstan and the vineyards at Lakeside Retreat", title: "Rainbow over the Lake", category: "views" as Category },
  { src: "/images/domesmountainview.jpeg", alt: "Both domes among autumn vineyard with mountain backdrop", title: "Mountain Panorama", category: "views" as Category },
  { src: "/images/magical-sunset.jpg", alt: "Stunning sunset over Lake Dunstan", title: "Lake Dunstan Sunset", category: "views" as Category },
  { src: "/images/vineyard.jpeg", alt: "Central Otago vineyard views from Lakeside Retreat", title: "Vineyard Views", category: "views" as Category },
  { src: "/images/pinotinternal.jpeg", alt: "Dome Pinot interior luxury living space with vineyard views", title: "Dome Interior", category: "domes" as Category },
  { src: "/images/dome-rose-interior.jpeg", alt: "Dome Rosé interior with panoramic windows overlooking the lake", title: "Dome Rosé Interior", category: "domes" as Category },
  { src: "/images/gallerydecksitting.jpeg", alt: "Dome deck overlooking the golden autumn vineyard and Lake Dunstan", title: "Deck Views", category: "amenities" as Category },
  { src: "/images/pinotspa.jpeg", alt: "Private hot tub with lake and mountain views", title: "Private Hot Tub", category: "amenities" as Category },
  { src: "/images/gallerydeck.jpeg", alt: "Relaxing on the deck with vineyard views", title: "Your Private Retreat", category: "amenities" as Category },
];

export function GalleryContent() {
  const [filter, setFilter] = useState<Category>("all");
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const filtered = filter === "all" ? galleryItems : galleryItems.filter((i) => i.category === filter);

  // Close lightbox on Escape and lock body scroll while open.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox]);

  return (
    <>
      {/* Filters */}
      <div
        className="flex justify-center gap-3 mb-8 flex-wrap"
        role="group"
        aria-label="Filter photos by category"
      >
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            aria-pressed={filter === cat}
            aria-label={`Filter by ${categoryLabels[cat]}`}
            className={`px-6 py-3 rounded-full border-2 border-burgundy font-medium transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy ${
              filter === cat
                ? "bg-burgundy text-white"
                : "bg-transparent text-burgundy hover:bg-burgundy hover:text-white"
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
            type="button"
            onClick={() => setLightbox({ src: item.src, alt: item.alt })}
            aria-label={`View photo: ${item.title}`}
            className="group relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer border-0 p-0 bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
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
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-8 text-white text-4xl cursor-pointer bg-transparent border-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Close photo viewer"
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
