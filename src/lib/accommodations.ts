export interface Accommodation {
  id: string;
  name: string;
  description: string;
  maxGuests: number;
  baseGuests: number;
  basePrice: number;
  minStay: number;
  securityDeposit: number;
  cleaningFee: number;
  adultsOnly: boolean;
  /** Minimum guest age in years. All properties are strictly adults-only (18+). */
  minimumAge: number;
  extraGuestFee?: number;
  petFee?: number;
  amenities: string[];
  images: string[];
}

// Pricing notes (GST-inclusive, cleaning bundled into nightly rate):
//   - Cottage $365/night base (2 guests) + $50/night per extra adult up to 3
//   - Dome Rosé $615/night, Dome Pinot $635/night (each sleeps 2)
//   - All three properties strictly 18+, adults only
//   - Security bond is a separate pre-auth, not a charge
const accommodations: Accommodation[] = [
  {
    id: "dome-pinot",
    name: "Dome Pinot",
    description: "Flagship 50sqm luxury dome with panoramic views and private spa",
    maxGuests: 2,
    baseGuests: 2,
    basePrice: 635,
    minStay: 1,
    securityDeposit: 300,
    cleaningFee: 0,
    adultsOnly: true,
    minimumAge: 18,
    amenities: ["Super King bed", "Private spa", "Panoramic views", "Solar powered"],
    images: ["Pinotfront.jpeg", "pinotinternal.jpeg"],
  },
  {
    id: "dome-rose",
    name: "Dome Ros\u00e9",
    description: "Romantic 40sqm retreat perfect for couples",
    maxGuests: 2,
    baseGuests: 2,
    basePrice: 615,
    minStay: 1,
    securityDeposit: 300,
    cleaningFee: 0,
    adultsOnly: true,
    minimumAge: 18,
    amenities: ["Super King bed", "Outdoor spa", "Mountain views", "Solar powered"],
    images: ["dome-rose-spa1.jpeg", "dome-rose-interior.jpeg"],
  },
  {
    id: "lakeside-cottage",
    name: "Lakeside Cottage",
    description: "Adults-only lakefront cottage with direct lake access and wood-fired hot tub",
    maxGuests: 3,
    baseGuests: 2,
    basePrice: 365,
    minStay: 2,
    securityDeposit: 300,
    cleaningFee: 0,
    adultsOnly: true,
    minimumAge: 18,
    extraGuestFee: 50,
    petFee: 50,
    amenities: ["Queen bed + sofa bed", "Kitchenette", "Lake views", "Pet friendly"],
    images: ["lakeside-cottage-exterior.jpeg", "cottagebedroom.jpeg"],
  },
];

export function getAll(): Accommodation[] {
  return accommodations;
}

export function getById(id: string): Accommodation | undefined {
  return accommodations.find((a) => a.id === id);
}

export function getValidIds(): string[] {
  return accommodations.map((a) => a.id);
}
