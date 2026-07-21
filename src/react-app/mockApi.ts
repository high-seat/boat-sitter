/**
 * API client for the boat-sitter backend.
 *
 * This module keeps the exact export surface the app used when it was a
 * localStorage mock, so no calling code had to change — only the bodies now
 * talk to the Cloudflare Worker at /api. The filename is kept for the same
 * reason (imports are `@/mockApi`); it is no longer a mock.
 */

import { lookupCoordinates } from "@/coordinates";

export type EngineType =
  | "Not specified"
  | "No engine"
  | "Inboard diesel"
  | "Inboard gasoline"
  | "Outboard gasoline"
  | "Inboard electric"
  | "Outboard electric"
  | "Hybrid";

export type VoltageType = "Not specified" | "12 V DC" | "24 V DC" | "48 V DC";

export type StoveFuelType =
  | "Not specified"
  | "No stove"
  | "Electric / induction"
  | "LPG / propane"
  | "Butane"
  | "Diesel"
  | "Alcohol"
  | "Kerosene";

export type Boat = {
  id: string;
  boatId?: string;
  name: string;
  type: string;
  length: string;
  location: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  homePort: string;
  dates: string;
  dateStart: string;
  duration: string;
  image: string;
  gallery: string[];
  owner: string;
  ownerImage: string;
  rating: number;
  reviews: number;
  applicants: number;
  description: string;
  home: string;
  responsibilities: string[];
  systems: string[];
  engineType: EngineType;
  voltageType: VoltageType;
  stoveFuelType: StoveFuelType;
  requirements: string[];
  minYearsExperience?: number;
  requiredExperience?: string[];
  requiredCertifications?: string[];
  requiredSkills?: string[];
  amenities: string[];
  pet?: string;
  featured?: boolean;
};

export type Vessel = Pick<
  Boat,
  | "id"
  | "name"
  | "type"
  | "length"
  | "homePort"
  | "image"
  | "gallery"
  | "owner"
  | "ownerImage"
  | "rating"
  | "reviews"
  | "description"
  | "home"
  | "systems"
  | "engineType"
  | "voltageType"
  | "stoveFuelType"
  | "amenities"
>;

export type Sit = {
  id: string;
  boatId: string;
  dates: string;
  dateStart: string;
  duration: string;
  location: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  responsibilities: string[];
  requirements: string[];
  minYearsExperience?: number;
  requiredExperience?: string[];
  requiredCertifications?: string[];
  requiredSkills?: string[];
  applicants: number;
  pet?: string;
  featured?: boolean;
};

export type ApplicationStatus = "new" | "shortlisted" | "accepted" | "declined";

export type ApplicationApplicant = {
  name: string;
  image: string;
  location: string;
  bio: string;
  languages: string[];
  preferredCountries: string[];
  skills: string[];
  yearsExperience: number;
  certifications: string[];
};

export type ApplicationMessage = {
  id: string;
  senderName: string;
  text: string;
  createdAt: string;
};

export type SitApplication = {
  id: string;
  sitId: string;
  boatName: string;
  ownerName: string;
  applicant: ApplicationApplicant;
  initialMessage: string;
  status: ApplicationStatus;
  createdAt: string;
  messages: ApplicationMessage[];
};

export type SupportRequest = {
  topic: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Geo helper (kept client-side; the API also returns coordinates when known)
// ---------------------------------------------------------------------------

// Whangarei isn't in the destinations list but is used by seed data, so keep a
// couple of extras alongside the shared table.
const EXTRA_COORDINATES: Record<string, [number, number]> = {
  whangarei: [-35.7251, 174.3237],
  "st. george's": [12.0561, -61.7488],
};

export function coordinatesForLocation(location: string, country: string) {
  const key = location.trim().toLowerCase().replace(/’/g, "'");
  const extra = EXTRA_COORDINATES[key];
  if (extra) return { latitude: extra[0], longitude: extra[1] };

  const hit = lookupCoordinates(location, country);
  // Fall back to [0, 0] (Gulf of Guinea) only when truly unknown — still wrong,
  // but at least deterministic and obvious, unlike the old [20, 0].
  return hit ?? { latitude: 0, longitude: 0 };
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

const BASE = "/api";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) {
    // Preserve the backend's error code so callers can branch on it
    // (e.g. VESSEL_HAS_SITS, APPLICATION_SIT_NOT_FOUND).
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }
  return (body.data ?? body) as T;
}

/** Fill nullable coordinate/optional fields so results satisfy the app types. */
function normalizeBoat(raw: Record<string, unknown>): Boat {
  const location = String(raw.location ?? "");
  const country = String(raw.country ?? "");
  const coords =
    raw.latitude != null && raw.longitude != null
      ? { latitude: Number(raw.latitude), longitude: Number(raw.longitude) }
      : coordinatesForLocation(location, country);
  return {
    ...(raw as Boat),
    latitude: coords.latitude,
    longitude: coords.longitude,
    pet: (raw.pet as string | null) ?? undefined,
    minYearsExperience: (raw.minYearsExperience as number | null) ?? undefined,
    featured: Boolean(raw.featured),
  };
}

function normalizeSit(raw: Record<string, unknown>): Sit {
  const coords =
    raw.latitude != null && raw.longitude != null
      ? { latitude: Number(raw.latitude), longitude: Number(raw.longitude) }
      : coordinatesForLocation(String(raw.location ?? ""), String(raw.country ?? ""));
  return {
    ...(raw as Sit),
    latitude: coords.latitude,
    longitude: coords.longitude,
    pet: (raw.pet as string | null) ?? undefined,
    minYearsExperience: (raw.minYearsExperience as number | null) ?? undefined,
    featured: Boolean(raw.featured),
  };
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export async function getBoats(): Promise<Boat[]> {
  const rows = await api<Record<string, unknown>[]>("/boats");
  return rows.map(normalizeBoat);
}

export async function getBoat(id: string): Promise<Boat | undefined> {
  try {
    const row = await api<Record<string, unknown>>(`/boats/${encodeURIComponent(id)}`);
    return normalizeBoat(row);
  } catch {
    return undefined;
  }
}

export async function getVessels(): Promise<Vessel[]> {
  return api<Vessel[]>("/vessels");
}

export async function getSits(): Promise<Sit[]> {
  const rows = await api<Record<string, unknown>[]>("/sits");
  return rows.map(normalizeSit);
}

export async function saveVessel(vessel: Vessel): Promise<Vessel> {
  return api<Vessel>(`/vessels/${encodeURIComponent(vessel.id)}`, {
    method: "PUT",
    body: JSON.stringify(vessel),
  });
}

export async function deleteVessel(id: string): Promise<void> {
  await api<unknown>(`/vessels/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function updateOwnerOnVessels(
  previousName: string,
  owner: { name: string; image: string },
): Promise<void> {
  // Propagate an owner profile rename across their vessels. This is a
  // mock-auth-era nicety; once identity is a stable user id (see AUTH.md) the
  // owner name/image will be derived, not duplicated, and this can be removed.
  const vessels = await api<Vessel[]>(`/vessels?owner=${encodeURIComponent(previousName)}`);
  await Promise.all(
    vessels.map((vessel) => saveVessel({ ...vessel, owner: owner.name, ownerImage: owner.image })),
  );
}

export async function saveSit(sit: Sit): Promise<Sit> {
  const saved = await api<Record<string, unknown>>(`/sits/${encodeURIComponent(sit.id)}`, {
    method: "PUT",
    body: JSON.stringify(sit),
  });
  return normalizeSit(saved);
}

export async function deleteSit(id: string): Promise<void> {
  await api<unknown>(`/sits/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export async function sendApplication(
  sitId: string,
  message: string,
  applicant: Omit<ApplicationApplicant, "yearsExperience" | "certifications"> & {
    yearsExperience?: number;
    certifications?: string[];
  },
): Promise<SitApplication> {
  return api<SitApplication>("/applications", {
    method: "POST",
    body: JSON.stringify({
      sitId,
      message,
      applicant: {
        ...applicant,
        yearsExperience: applicant.yearsExperience ?? 0,
        certifications: applicant.certifications ?? [],
      },
    }),
  });
}

export async function getApplicationsForSit(sitId: string): Promise<SitApplication[]> {
  return api<SitApplication[]>(`/applications?sitId=${encodeURIComponent(sitId)}`);
}

export async function getApplicationsForUser(userName: string): Promise<SitApplication[]> {
  return api<SitApplication[]>(`/applications?user=${encodeURIComponent(userName)}`);
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<SitApplication> {
  return api<SitApplication>(`/applications/${encodeURIComponent(applicationId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function sendApplicationMessage(
  applicationId: string,
  senderName: string,
  text: string,
): Promise<SitApplication> {
  return api<SitApplication>(`/applications/${encodeURIComponent(applicationId)}/messages`, {
    method: "POST",
    body: JSON.stringify({ senderName, text }),
  });
}

// ---------------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------------

export async function submitSupportRequest(
  request: Omit<SupportRequest, "createdAt">,
): Promise<SupportRequest> {
  return api<SupportRequest>("/support", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
