export interface Accommodation {
  id: string;
  name: string;
  description: string;
  maxGuests: number;
  baseGuests: number;
  minStay: number;
  adultsOnly: boolean;
  /** Minimum guest age in years. All properties are strictly adults-only (18+). */
  minimumAge: number;
  extraGuestFee?: number;
  petFee?: number;
  /**
   * Stay two nights or more and the second night is 25% off (12.5% off the
   * nightly total). Domes only — the cottage has no such offer.
   */
  secondNightDiscount?: boolean;
  amenities: string[];
  images: string[];
}

// Pricing notes (GST-inclusive, cleaning bundled into nightly rate):
//   - Nightly rates are NOT here. They come live from Uplisting's calendar
//     (lib/uplisting.ts fetchNightlyRates) and are quoted by lib/quote.ts.
//   - Cottage: +$100/night for a third adult, $25 pet fee flat per stay
//   - Domes: 25% off the second night on stays of 2+ nights
//   - All three properties strictly 18+, adults only
const accommodations: Accommodation[] = [
  {
    id: "dome-pinot",
    name: "Dome Pinot",
    description: "Flagship 50sqm luxury dome with panoramic views and private spa",
    maxGuests: 2,
    baseGuests: 2,
    minStay: 1,
    adultsOnly: true,
    minimumAge: 18,
    secondNightDiscount: true,
    amenities: ["Super King bed", "Private spa", "Panoramic views", "Solar powered"],
    images: ["Pinotfront.jpeg", "pinotinternal.jpeg"],
  },
  {
    id: "dome-rose",
    name: "Dome Ros\u00e9",
    description: "Romantic 40sqm retreat perfect for couples",
    maxGuests: 2,
    baseGuests: 2,
    minStay: 1,
    adultsOnly: true,
    minimumAge: 18,
    secondNightDiscount: true,
    amenities: ["Super King bed", "Outdoor spa", "Mountain views", "Solar powered"],
    images: ["dome-rose-spa1.jpeg", "dome-rose-interior.jpeg"],
  },
  {
    id: "lakeside-cottage",
    name: "Lakeside Cottage",
    description: "Adults-only lakefront cottage with direct lake access and wood-fired hot tub",
    maxGuests: 3,
    baseGuests: 2,
    minStay: 2,
    adultsOnly: true,
    minimumAge: 18,
    extraGuestFee: 100,
    petFee: 25,
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
