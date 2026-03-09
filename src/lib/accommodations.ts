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
  extraGuestFee?: number;
  petFee?: number;
  amenities: string[];
  images: string[];
}

const accommodations: Accommodation[] = [
  {
    id: "dome-pinot",
    name: "Dome Pinot",
    description: "Flagship 50sqm luxury dome with panoramic views and private spa",
    maxGuests: 2,
    baseGuests: 2,
    basePrice: 530,
    minStay: 1,
    securityDeposit: 300,
    cleaningFee: 50,
    adultsOnly: true,
    amenities: ["Super King bed", "Private spa", "Panoramic views", "Solar powered"],
    images: ["dome-pinot-hero.jpeg", "dome-pinot-interior.jpeg"],
  },
  {
    id: "dome-rose",
    name: "Dome Ros\u00e9",
    description: "Romantic 40sqm retreat perfect for couples",
    maxGuests: 2,
    baseGuests: 2,
    basePrice: 510,
    minStay: 1,
    securityDeposit: 300,
    cleaningFee: 50,
    adultsOnly: true,
    amenities: ["Super King bed", "Outdoor spa", "Mountain views", "Solar powered"],
    images: ["dome-rose-spa1.jpeg", "dome-rose-interior.jpeg"],
  },
  {
    id: "lakeside-cottage",
    name: "Lakeside Cottage",
    description: "Family-friendly cottage with direct lake access",
    maxGuests: 3,
    baseGuests: 2,
    basePrice: 295,
    minStay: 2,
    securityDeposit: 300,
    cleaningFee: 50,
    adultsOnly: false,
    extraGuestFee: 100,
    petFee: 50,
    amenities: ["Queen bed + sofa bed", "Full kitchen", "Lake views", "Pet friendly"],
    images: ["lakeside-cottage-exterior.jpeg", "lakeside-cottage-interior.jpeg"],
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
