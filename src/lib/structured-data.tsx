const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://lakesideretreat.co.nz";

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}

const address = {
  "@type": "PostalAddress",
  streetAddress: "96 Smiths Way, Mount Pisa",
  addressLocality: "Cromwell",
  addressRegion: "Otago",
  postalCode: "9383",
  addressCountry: "NZ",
};

const geo = {
  "@type": "GeoCoordinates",
  latitude: -45.03871,
  longitude: 169.197693,
};

const sameAs = [
  "https://www.facebook.com/lakesideretreatnz",
  "https://www.instagram.com/lakesideretreatnz",
];

export function createLodgingBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "Lakeside Retreat",
    description:
      "Luxury glamping domes and lakefront cottage on Lake Dunstan in Central Otago, New Zealand.",
    url: BASE_URL,
    image: `${BASE_URL}/images/domes-vineyard-sunset.jpg`,
    address,
    geo,
    telephone: "+64 21 368 682",
    email: "info@lakesideretreat.co.nz",
    priceRange: "$295-$530 NZD per night",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "416",
      bestRating: "5",
    },
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Private Spa", value: true },
      { "@type": "LocationFeatureSpecification", name: "Free WiFi", value: true },
      { "@type": "LocationFeatureSpecification", name: "Free Parking", value: true },
      { "@type": "LocationFeatureSpecification", name: "Lake Access", value: true },
      { "@type": "LocationFeatureSpecification", name: "Cycle Trail Access", value: true },
    ],
    checkinTime: "15:00",
    checkoutTime: "10:00",
    sameAs,
  };
}

export function createOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lakeside Retreat Central Otago",
    alternateName: "Lakeside Retreat",
    url: BASE_URL,
    logo: `${BASE_URL}/images/logormbg.png`,
    foundingDate: "2019",
    founder: { "@type": "Person", name: "Stephen & Sandy" },
    description:
      "Luxury glamping and lakefront accommodation specialists in Central Otago's wine country on Lake Dunstan",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+64-21-368-682",
      contactType: "customer service",
      availableLanguage: ["English"],
      areaServed: "NZ",
    },
    sameAs,
  };
}

export function createWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lakeside Retreat Central Otago",
    url: BASE_URL,
  };
}

export function createBreadcrumbSchema(
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.path}`,
    })),
  };
}

export function createFaqSchema(
  faqs: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

interface PropertySchemaParams {
  id: string;
  name: string;
  description: string;
  price: number;
  floorSize: number;
  maxOccupancy: number;
  bedType: string;
  images: string[];
  amenities: string[];
  reviewCount: string;
}

export function createPropertySchema(params: PropertySchemaParams) {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": `${BASE_URL}/${params.id}#accommodation`,
    name: `${params.name} - Lakeside Retreat`,
    description: params.description,
    url: `${BASE_URL}/${params.id}`,
    image: params.images.map((img) => `${BASE_URL}/images/${img}`),
    address,
    geo,
    telephone: "+64-21-368-682",
    email: "info@lakesideretreat.co.nz",
    priceRange: `$${params.price} NZD per night`,
    amenityFeature: params.amenities.map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
    containsPlace: {
      "@type": "Accommodation",
      name: params.name,
      description: params.description,
      occupancy: { "@type": "QuantitativeValue", maxValue: params.maxOccupancy },
      floorSize: { "@type": "QuantitativeValue", value: params.floorSize, unitCode: "MTK" },
      bed: { "@type": "BedDetails", typeOfBed: params.bedType, numberOfBeds: 1 },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: params.reviewCount,
      bestRating: "5",
    },
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/book?a=${params.id}`,
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
        ],
      },
      result: { "@type": "LodgingReservation", name: `Book ${params.name}` },
    },
  };
}

export function createContactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Lakeside Retreat",
    description:
      "Contact information and enquiry form for Lakeside Retreat Central Otago",
    url: `${BASE_URL}/contact`,
    mainEntity: {
      "@type": "LodgingBusiness",
      name: "Lakeside Retreat Central Otago",
      telephone: "+64-21-368-682",
      email: "info@lakesideretreat.co.nz",
      address,
      geo,
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "08:00",
        closes: "20:00",
      },
    },
  };
}

interface ArticleSchemaParams {
  title: string;
  description: string;
  path: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}

export function createArticleSchema(params: ArticleSchemaParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: params.title,
    description: params.description,
    url: `${BASE_URL}${params.path}`,
    image: params.image ? `${BASE_URL}/images/${params.image}` : undefined,
    datePublished: params.datePublished || "2025-01-01",
    dateModified: params.dateModified || "2026-03-01",
    author: { "@type": "Organization", name: "Lakeside Retreat Central Otago" },
    publisher: {
      "@type": "Organization",
      name: "Lakeside Retreat Central Otago",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/images/logormbg.png` },
    },
    inLanguage: "en-NZ",
  };
}
