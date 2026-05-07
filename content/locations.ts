export type Location = {
  region: string;
  city: string;
  country: string;
  address: string;
  coordinates: { lat: number; lng: number };
};

export const LOCATIONS: Location[] = [
  {
    region: "EU",
    city: "Leiden",
    country: "Netherlands",
    address: "Schipholweg 13, 2316 XB Leiden",
    coordinates: { lat: 52.1601, lng: 4.4970 },
  },
  {
    region: "US",
    city: "Atlanta",
    country: "United States",
    address: "1445 Woodmont Ln NW #1381, Atlanta GA 30318",
    coordinates: { lat: 33.7944, lng: -84.4267 },
  },
  {
    region: "APAC",
    city: "Lucknow",
    country: "India",
    address: "Besides Phoenix United, LDA Lucknow, UP 226012",
    coordinates: { lat: 26.8467, lng: 80.9462 },
  },
];
