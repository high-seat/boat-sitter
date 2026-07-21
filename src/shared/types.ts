/**
 * Shared between the Worker and the React app.
 * Mirrors the `boats` table in src/worker/db/schema.ts.
 */
export interface Boat {
  id: string;
  name: string;
  type: string;
  length: string;
  location: string;
  country: string;
  region: string;
  dates: string;
  dateStart: string;
  dateEnd: string | null;
  duration: string;
  nights: number | null;
  image: string;
  gallery: string[];
  owner: string;
  ownerImage: string | null;
  rating: number;
  reviews: number;
  applicants: number;
  description: string;
  home: string | null;
  responsibilities: string[];
  systems: string[];
  requirements: string[];
  amenities: string[];
  pet: string | null;
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface BoatListResponse {
  data: Boat[];
  meta: Pagination;
}

export interface BoatDetailResponse {
  data: Boat;
}

export interface Facet {
  value: string;
  count: number;
}

export interface FacetsResponse {
  regions: Facet[];
  countries: Facet[];
  types: Facet[];
}

export interface ApiError {
  error: string;
}

export interface BoatListParams {
  region?: string;
  country?: string;
  type?: string;
  featured?: boolean;
  minRating?: number;
  availableFrom?: string;
  availableTo?: string;
  q?: string;
  sort?:
    | "dateStart"
    | "-dateStart"
    | "rating"
    | "-rating"
    | "applicants"
    | "-applicants"
    | "name";
  page?: number;
  limit?: number;
}

/** Tiny typed client for the React app. */
export async function fetchBoats(
  params: BoatListParams = {},
  init?: RequestInit,
): Promise<BoatListResponse> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, String(value));
    }
  }
  const res = await fetch(`/api/boats?${qs}`, init);
  if (!res.ok) throw new Error(`Failed to load boats: ${res.status}`);
  return res.json();
}

export async function fetchBoat(id: string, init?: RequestInit): Promise<Boat> {
  const res = await fetch(`/api/boats/${encodeURIComponent(id)}`, init);
  if (!res.ok) throw new Error(`Failed to load boat "${id}": ${res.status}`);
  const body: BoatDetailResponse = await res.json();
  return body.data;
}

export async function fetchFacets(init?: RequestInit): Promise<FacetsResponse> {
  const res = await fetch("/api/boats/facets", init);
  if (!res.ok) throw new Error(`Failed to load facets: ${res.status}`);
  return res.json();
}
