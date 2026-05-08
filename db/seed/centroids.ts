// Hardcoded Utah city + county centroids for seed-time geocoding.
// The map dataset has only `Full Address` strings; we resolve city -> lat/lng
// at seed time so the front-end map can render pins without an external API.

export type Centroid = {
  lat: number;
  lng: number;
  county: string;
};

// Cities seen in `Map Data for Builder Day  - Sheet1.csv`, plus a few common
// neighbors. Match is case-insensitive substring against `address_text`.
// Order longest-first so "Salt Lake City" matches before any embedded "Salt".
export const cityCentroids: Record<string, Centroid> = {
  "Salt Lake City": { lat: 40.7608, lng: -111.891, county: "Salt Lake" },
  "South Jordan": { lat: 40.5621, lng: -111.9297, county: "Salt Lake" },
  "West Valley City": { lat: 40.6916, lng: -112.0011, county: "Salt Lake" },
  "Cottonwood Heights": {
    lat: 40.6196,
    lng: -111.8104,
    county: "Salt Lake",
  },
  "Pleasant Grove": { lat: 40.3641, lng: -111.7385, county: "Utah" },
  "American Fork": { lat: 40.3769, lng: -111.7958, county: "Utah" },
  "Saratoga Springs": { lat: 40.3499, lng: -111.9043, county: "Utah" },
  "Heber City": { lat: 40.5069, lng: -111.4133, county: "Wasatch" },
  "Park City": { lat: 40.6461, lng: -111.498, county: "Summit" },
  "Fruit Heights": { lat: 41.0341, lng: -111.9013, county: "Davis" },
  "Cedar City": { lat: 37.6775, lng: -113.0619, county: "Iron" },
  "St. George": { lat: 37.0965, lng: -113.5684, county: "Washington" },
  "Spanish Fork": { lat: 40.1149, lng: -111.6549, county: "Utah" },
  "West Jordan": { lat: 40.6097, lng: -111.9391, county: "Salt Lake" },
  Holladay: { lat: 40.6688, lng: -111.8243, county: "Salt Lake" },
  Bluffdale: { lat: 40.4789, lng: -111.9399, county: "Salt Lake" },
  Herriman: { lat: 40.5141, lng: -112.033, county: "Salt Lake" },
  Highland: { lat: 40.4286, lng: -111.7977, county: "Utah" },
  Vineyard: { lat: 40.2964, lng: -111.7616, county: "Utah" },
  Kaysville: { lat: 41.0353, lng: -111.9383, county: "Davis" },
  Midvale: { lat: 40.6111, lng: -111.8983, county: "Salt Lake" },
  Hurricane: { lat: 37.1755, lng: -113.2899, county: "Washington" },
  Tooele: { lat: 40.5308, lng: -112.2982, county: "Tooele" },
  Bountiful: { lat: 40.8894, lng: -111.8807, county: "Davis" },
  Layton: { lat: 41.0602, lng: -111.9711, county: "Davis" },
  Murray: { lat: 40.6669, lng: -111.888, county: "Salt Lake" },
  Sandy: { lat: 40.5649, lng: -111.8389, county: "Salt Lake" },
  Draper: { lat: 40.5247, lng: -111.8638, county: "Salt Lake" },
  Lehi: { lat: 40.3916, lng: -111.8508, county: "Utah" },
  Provo: { lat: 40.2338, lng: -111.6585, county: "Utah" },
  Orem: { lat: 40.2969, lng: -111.6946, county: "Utah" },
  Logan: { lat: 41.737, lng: -111.8338, county: "Cache" },
  Ogden: { lat: 41.223, lng: -111.9738, county: "Weber" },
  Lindon: { lat: 40.341, lng: -111.7208, county: "Utah" },
  Alpine: { lat: 40.4538, lng: -111.7724, county: "Utah" },
  Roy: { lat: 41.1616, lng: -112.0264, county: "Weber" },
};

// All 29 Utah counties, ~county-seat centroid (rough — sufficient for fallback).
export const countyCentroids: Record<string, { lat: number; lng: number }> = {
  Beaver: { lat: 38.275, lng: -113.236 },
  "Box Elder": { lat: 41.5, lng: -113.083 },
  Cache: { lat: 41.7333, lng: -111.7333 },
  Carbon: { lat: 39.6, lng: -110.583 },
  Daggett: { lat: 40.8833, lng: -109.5 },
  Davis: { lat: 41.0167, lng: -112.1167 },
  Duchesne: { lat: 40.3, lng: -110.4 },
  Emery: { lat: 38.9833, lng: -110.7 },
  Garfield: { lat: 37.85, lng: -111.4333 },
  Grand: { lat: 38.9833, lng: -109.5667 },
  Iron: { lat: 37.85, lng: -113.2833 },
  Juab: { lat: 39.7, lng: -112.7833 },
  Kane: { lat: 37.2833, lng: -111.8833 },
  Millard: { lat: 39.0833, lng: -113.1 },
  Morgan: { lat: 41.0833, lng: -111.5667 },
  Piute: { lat: 38.3333, lng: -112.1167 },
  Rich: { lat: 41.6333, lng: -111.2 },
  "Salt Lake": { lat: 40.6669, lng: -111.9244 },
  "San Juan": { lat: 37.6, lng: -109.85 },
  Sanpete: { lat: 39.3667, lng: -111.55 },
  Sevier: { lat: 38.7167, lng: -111.8 },
  Summit: { lat: 40.8667, lng: -110.95 },
  Tooele: { lat: 40.45, lng: -113.1167 },
  Uintah: { lat: 40.1167, lng: -109.5167 },
  Utah: { lat: 40.1187, lng: -111.6603 },
  Wasatch: { lat: 40.3333, lng: -111.1667 },
  Washington: { lat: 37.2833, lng: -113.5 },
  Wayne: { lat: 38.3333, lng: -111.0167 },
  Weber: { lat: 41.2667, lng: -112.0333 },
};

// Sort cities by length descending so multi-word names match before substrings.
const cityOrder = Object.keys(cityCentroids).sort(
  (a, b) => b.length - a.length,
);

const countyOrder = Object.keys(countyCentroids).sort(
  (a, b) => b.length - a.length,
);

export type Geocoded = {
  lat: number | null;
  lng: number | null;
  city: string | null;
  county: string | null;
};

export function geocodeFromAddress(
  address: string | null | undefined,
): Geocoded {
  if (!address) return { lat: null, lng: null, city: null, county: null };
  const haystack = address.toLowerCase();

  for (const city of cityOrder) {
    if (haystack.includes(city.toLowerCase())) {
      const c = cityCentroids[city];
      return { lat: c.lat, lng: c.lng, city, county: c.county };
    }
  }

  for (const county of countyOrder) {
    if (haystack.includes(county.toLowerCase())) {
      const c = countyCentroids[county];
      return { lat: c.lat, lng: c.lng, city: null, county };
    }
  }

  return { lat: null, lng: null, city: null, county: null };
}
