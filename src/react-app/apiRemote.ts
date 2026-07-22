import { apiDelete, apiGet, apiPatch, apiPost, apiPut, ApiError } from "@/apiClient";
import { lookupCoordinates } from "@/coordinates";
import { boatsSearchQueryString, type BoatSearchParams } from "../shared/boatsSearch";

export type ApiEngineType = string;
export type ApiVoltageType = string;
export type ApiStoveFuelType = string;

type BoatPhoto = { url: string; caption?: string; focus?: string };
type SitType = "liveaboard" | "daytimeChecks";
type ApplicationStatus = "new" | "shortlisted" | "accepted" | "declined" | "withdrawn";

type Boat = {
  id: string;
  boatId?: string;
  name: string;
  type: string;
  length: string;
  location: string;
  country: string;
  latitude: number;
  longitude: number;
  approximateLocation?: boolean;
  homePort: string;
  dates: string;
  dateStart: string;
  duration: string;
  image: string;
  gallery: BoatPhoto[];
  owner: string;
  ownerLanguages: string[];
  ownerImage: string;
  rating: number;
  reviews: number;
  maxGuests?: number;
  applicants: number;
  description: string;
  home: string;
  responsibilities: string[];
  sitType?: SitType;
  systems: string[];
  engineType: ApiEngineType;
  voltageType: ApiVoltageType;
  stoveFuelType: ApiStoveFuelType;
  requirements: string[];
  minYearsExperience?: number;
  requiredExperience?: string[];
  requiredCertifications?: string[];
  requiredSkills?: string[];
  amenities: string[];
  pet?: string;
  featured?: boolean;
  nonSmokerRequired?: boolean;
  accepted?: boolean;
  applicationsOpen?: boolean;
};

type Vessel = Pick<
  Boat,
  | "id"
  | "name"
  | "type"
  | "length"
  | "homePort"
  | "image"
  | "gallery"
  | "owner"
  | "ownerLanguages"
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
> & {
  privateAccess?: {
    wifiNetwork?: string;
    wifiPassword?: string;
    accessCodes?: string;
    otherNotes?: string;
  };
};

type Sit = {
  id: string;
  boatId: string;
  dates: string;
  dateStart: string;
  duration: string;
  location: string;
  country: string;
  latitude: number;
  longitude: number;
  approximateLocation?: boolean;
  fullAddress?: string;
  sitType?: SitType;
  responsibilities: string[];
  requirements: string[];
  minYearsExperience?: number;
  requiredExperience?: string[];
  requiredCertifications?: string[];
  requiredSkills?: string[];
  maxGuests: number;
  applicants: number;
  pet?: string;
  featured?: boolean;
  nonSmokerRequired?: boolean;
  accepted?: boolean;
  applicationsOpen?: boolean;
};

type ApplicationApplicant = {
  name: string;
  image: string;
  location: string;
  bio: string;
  languages: string[];
  preferredCountries: string[];
  skills: string[];
  memberSince: number;
  yearsExperience: number;
  certifications: string[];
  completedSits: number;
};

type SitApplication = {
  id: string;
  sitId: string;
  boatName: string;
  ownerName: string;
  partySize: number;
  ownerPhone?: string;
  applicant: ApplicationApplicant;
  initialMessage: string;
  status: ApplicationStatus;
  createdAt: string;
  messages: Array<{
    id: string;
    senderName: string;
    text: string;
    createdAt: string;
    kind?: "user" | "system";
    systemKind?:
      | "accepted"
      | "declined"
      | "applicantsClosed"
      | "videoCallRequest"
      | "videoCallCounter"
      | "videoCallAccepted"
      | "videoCallDeclined"
      | "phoneShared"
      | "withdrawn";
    videoCall?: { startsAt: string; durationMinutes: number };
    sharedPhone?: string;
  }>;
};

type SupportRequest = {
  topic: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

function normalizeGallery(gallery: Array<string | BoatPhoto> | undefined | null): BoatPhoto[] {
  return (gallery ?? []).map((entry) => (typeof entry === "string" ? { url: entry } : entry));
}

function coordsFor(
  location: string,
  country: string,
  latitude: number | null,
  longitude: number | null,
) {
  if (latitude != null && longitude != null) return { latitude, longitude };
  return lookupCoordinates(location, country) ?? { latitude: 20, longitude: 0 };
}

type ApiBoat = {
  id: string;
  boatId: string;
  name: string;
  type: string;
  length: string;
  location: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
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
  engineType: string;
  voltageType: string;
  stoveFuelType: string;
  requirements: string[];
  minYearsExperience: number | null;
  requiredExperience: string[];
  requiredCertifications: string[];
  requiredSkills: string[];
  amenities: string[];
  pet: string | null;
  featured: boolean;
  sitType?: "liveaboard" | "daytimeChecks";
  accepted?: boolean;
  applicationsOpen?: boolean;
};

type ApiVessel = {
  id: string;
  name: string;
  type: string;
  length: string;
  homePort: string;
  image: string;
  gallery: string[];
  owner: string;
  ownerImage: string;
  rating: number;
  reviews: number;
  description: string;
  home: string;
  systems: string[];
  engineType: string;
  voltageType: string;
  stoveFuelType: string;
  amenities: string[];
  privateAccess?: {
    wifiNetwork?: string;
    wifiPassword?: string;
    accessCodes?: string;
    otherNotes?: string;
  } | null;
};

type ApiSit = {
  id: string;
  boatId: string;
  dates: string;
  dateStart: string;
  duration: string;
  location: string;
  country: string;
  fullAddress?: string | null;
  latitude: number | null;
  longitude: number | null;
  responsibilities: string[];
  requirements: string[];
  minYearsExperience?: number | null;
  requiredExperience: string[];
  requiredCertifications: string[];
  requiredSkills: string[];
  applicants: number;
  pet?: string | null;
  featured: boolean;
  published: boolean;
  sitType?: "liveaboard" | "daytimeChecks";
};

type ApiApplication = {
  id: string;
  sitId: string;
  boatName: string;
  ownerName: string;
  partySize?: number;
  ownerPhone?: string;
  applicant: {
    name: string;
    image: string;
    location: string;
    bio: string;
    languages: string[];
    preferredCountries: string[];
    skills: string[];
    yearsExperience: number;
    certifications: string[];
    memberSince?: number;
    completedSits?: number;
  };
  initialMessage: string;
  status: string;
  createdAt: string;
  messages: Array<{
    id: string;
    senderName: string;
    text: string;
    createdAt: string;
    kind?: "user" | "system";
    systemKind?: string;
    videoCall?: { startsAt: string; durationMinutes: number };
    sharedPhone?: string;
  }>;
};

export type ApiProfile = {
  userId?: string;
  email: string;
  emailConfirmed?: boolean;
  name: string;
  legalName: string;
  image: string;
  coverImage?: string;
  bio: string;
  location: string;
  languages: string[];
  preferredCountries: string[];
  skills: string[];
  preferredLanguage: string;
  measurementSystem: "metric" | "imperial";
  emailNotifications: Record<string, boolean>;
  sitDefaults: Record<string, unknown>;
  memberSince: number;
  phoneCountryCode: string;
  phoneNumber: string;
  yearsExperience?: number;
  certifications?: string[];
  completedSits?: number;
};

export type ApiNotification = {
  id: string;
  type: string;
  actor?: string;
  boatName?: string;
  href: string;
  createdAt: string;
  read?: boolean;
};

export type ApiReview = {
  id: string;
  sitId: string;
  boatName: string;
  applicationId: string;
  sitterName: string;
  ownerName: string;
  ownerImage: string;
  rating: number;
  text: string;
  createdAt: string;
  location: string;
  response?: { text: string; createdAt: string };
};

let sessionCachedAt = 0;
let sessionCachedValue = false;

/** True when Better Auth has a real cookie session (e.g. Google). */
export async function hasApiSession(): Promise<boolean> {
  const now = Date.now();
  if (now - sessionCachedAt < 5_000) return sessionCachedValue;
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) {
      sessionCachedValue = false;
    } else {
      const body = (await res.json()) as { user: unknown };
      sessionCachedValue = Boolean(body.user);
    }
  } catch {
    sessionCachedValue = false;
  }
  sessionCachedAt = now;
  return sessionCachedValue;
}

export function invalidateApiSessionCache() {
  sessionCachedAt = 0;
}

function asEngineType(value: string): ApiEngineType {
  return value;
}

function asVoltageType(value: string): ApiVoltageType {
  return value;
}

function asStoveFuelType(value: string): ApiStoveFuelType {
  return value;
}

function galleryUrls(gallery: Array<string | BoatPhoto> | undefined): string[] {
  return normalizeGallery(gallery).map((photo) => photo.url);
}

export function normalizeApiBoat(row: ApiBoat): Boat {
  const coords = coordsFor(row.location, row.country, row.latitude, row.longitude);
  return {
    id: row.id,
    boatId: row.boatId,
    name: row.name,
    type: row.type,
    length: row.length,
    location: row.location,
    country: row.country,
    latitude: coords.latitude,
    longitude: coords.longitude,
    approximateLocation: true,
    homePort: row.homePort,
    dates: row.dates,
    dateStart: row.dateStart,
    duration: row.duration,
    image: row.image,
    gallery: normalizeGallery(row.gallery),
    owner: row.owner,
    ownerLanguages: ["English"],
    ownerImage: row.ownerImage,
    rating: row.rating,
    reviews: row.reviews,
    applicants: row.applicants,
    description: row.description,
    home: row.home,
    responsibilities: row.responsibilities,
    sitType: (row.sitType === "daytimeChecks" ? "daytimeChecks" : "liveaboard") as SitType,
    systems: row.systems,
    engineType: asEngineType(row.engineType),
    voltageType: asVoltageType(row.voltageType),
    stoveFuelType: asStoveFuelType(row.stoveFuelType),
    requirements: row.requirements,
    minYearsExperience: row.minYearsExperience ?? undefined,
    requiredExperience: row.requiredExperience,
    requiredCertifications: row.requiredCertifications,
    requiredSkills: row.requiredSkills,
    amenities: row.amenities,
    pet: row.pet ?? undefined,
    featured: row.featured,
    maxGuests: 2,
    applicationsOpen: row.applicationsOpen ?? true,
    accepted: Boolean(row.accepted),
  };
}

export function normalizeApiVessel(row: ApiVessel): Vessel {
  const privateAccess = row.privateAccess
    ? {
        wifiNetwork: row.privateAccess.wifiNetwork || undefined,
        wifiPassword: row.privateAccess.wifiPassword || undefined,
        accessCodes: row.privateAccess.accessCodes || undefined,
        otherNotes: row.privateAccess.otherNotes || undefined,
      }
    : undefined;
  const hasPrivate =
    privateAccess &&
    Boolean(
      privateAccess.wifiNetwork ||
        privateAccess.wifiPassword ||
        privateAccess.accessCodes ||
        privateAccess.otherNotes,
    );
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    length: row.length,
    homePort: row.homePort,
    image: row.image,
    gallery: normalizeGallery(row.gallery),
    owner: row.owner,
    ownerLanguages: ["English"],
    ownerImage: row.ownerImage,
    rating: row.rating,
    reviews: row.reviews,
    description: row.description,
    home: row.home,
    systems: row.systems,
    engineType: asEngineType(row.engineType),
    voltageType: asVoltageType(row.voltageType),
    stoveFuelType: asStoveFuelType(row.stoveFuelType),
    amenities: row.amenities,
    ...(hasPrivate ? { privateAccess } : {}),
  };
}

export function normalizeApiSit(row: ApiSit): Sit {
  const coords = coordsFor(row.location, row.country, row.latitude, row.longitude);
  return {
    id: row.id,
    boatId: row.boatId,
    dates: row.dates,
    dateStart: row.dateStart,
    duration: row.duration,
    location: row.location,
    country: row.country,
    fullAddress: row.fullAddress?.trim() || undefined,
    latitude: coords.latitude,
    longitude: coords.longitude,
    approximateLocation: true,
    sitType: row.sitType === "daytimeChecks" ? "daytimeChecks" : "liveaboard",
    responsibilities: row.responsibilities,
    requirements: row.requirements,
    minYearsExperience: row.minYearsExperience ?? undefined,
    requiredExperience: row.requiredExperience,
    requiredCertifications: row.requiredCertifications,
    requiredSkills: row.requiredSkills,
    maxGuests: 2,
    applicants: row.applicants,
    pet: row.pet ?? undefined,
    featured: row.featured,
    applicationsOpen: row.published,
  };
}

export function vesselToApiBody(vessel: Vessel) {
  return {
    id: vessel.id,
    name: vessel.name,
    type: vessel.type,
    length: vessel.length,
    homePort: vessel.homePort,
    image: vessel.image,
    gallery: galleryUrls(vessel.gallery),
    owner: vessel.owner,
    ownerImage: vessel.ownerImage,
    rating: vessel.rating,
    reviews: vessel.reviews,
    description: vessel.description,
    home: vessel.home,
    systems: vessel.systems,
    engineType: vessel.engineType,
    voltageType: vessel.voltageType,
    stoveFuelType: vessel.stoveFuelType,
    amenities: vessel.amenities,
    privateAccess: vessel.privateAccess ?? null,
  };
}

export function sitToApiBody(sit: Sit) {
  return {
    id: sit.id,
    boatId: sit.boatId,
    dates: sit.dates,
    dateStart: sit.dateStart,
    duration: sit.duration,
    location: sit.location,
    country: sit.country,
    fullAddress: sit.fullAddress,
    latitude: sit.latitude,
    longitude: sit.longitude,
    responsibilities: sit.responsibilities,
    requirements: sit.requirements,
    minYearsExperience: sit.minYearsExperience ?? null,
    requiredExperience: sit.requiredExperience ?? [],
    requiredCertifications: sit.requiredCertifications ?? [],
    requiredSkills: sit.requiredSkills ?? [],
    applicants: sit.applicants,
    pet: sit.pet ?? null,
    featured: Boolean(sit.featured),
    published: sit.applicationsOpen !== false,
    sitType: sit.sitType ?? "liveaboard",
  };
}

export function normalizeApiApplication(row: ApiApplication): SitApplication {
  const status = (
    ["new", "shortlisted", "accepted", "declined", "withdrawn"].includes(row.status)
      ? row.status
      : "new"
  ) as ApplicationStatus;
  return {
    id: row.id,
    sitId: row.sitId,
    boatName: row.boatName,
    ownerName: row.ownerName,
    partySize: row.partySize ?? 1,
    ownerPhone: row.ownerPhone,
    applicant: {
      name: row.applicant.name,
      image: row.applicant.image,
      location: row.applicant.location,
      bio: row.applicant.bio,
      languages: row.applicant.languages ?? [],
      preferredCountries: row.applicant.preferredCountries ?? [],
      skills: row.applicant.skills ?? [],
      memberSince: row.applicant.memberSince ?? new Date(row.createdAt).getFullYear(),
      yearsExperience: row.applicant.yearsExperience ?? 0,
      certifications: row.applicant.certifications ?? [],
      completedSits: row.applicant.completedSits ?? 0,
    },
    initialMessage: row.initialMessage,
    status,
    createdAt: row.createdAt,
    messages: row.messages.map((message) => ({
      id: message.id,
      senderName: message.senderName,
      text: message.text,
      createdAt: message.createdAt,
      kind: message.kind === "system" ? ("system" as const) : ("user" as const),
      systemKind: message.systemKind as SitApplication["messages"][number]["systemKind"],
      videoCall: message.videoCall,
      sharedPhone: message.sharedPhone,
    })),
  };
}

export async function apiGetBoats(): Promise<Boat[]> {
  const rows = await apiGet<ApiBoat[]>("/api/boats");
  return rows.map(normalizeApiBoat);
}

export async function apiGetBoatsPage(params: BoatSearchParams): Promise<{
  boats: Boat[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const qs = boatsSearchQueryString(params);
  const res = await fetch(`/api/boats${qs}`, { credentials: "include" });
  const body = (await res.json()) as {
    data?: ApiBoat[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    error?: string;
  };
  if (!res.ok) {
    throw new ApiError(res.status, body.error || res.statusText, body);
  }
  const boats = (body.data ?? []).map(normalizeApiBoat);
  const total = body.total ?? boats.length;
  const limit = body.limit ?? (params.limit && params.limit > 0 ? params.limit : boats.length || 1);
  const page = body.page ?? 0;
  const totalPages = body.totalPages ?? Math.max(1, Math.ceil(total / limit));
  return { boats, total, page, limit, totalPages };
}

export async function apiGetBoat(id: string): Promise<Boat | undefined> {
  try {
    const row = await apiGet<ApiBoat>(`/api/boats/${encodeURIComponent(id)}`);
    return normalizeApiBoat(row);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

export async function apiGetVessels(owner?: string): Promise<Vessel[]> {
  const path = owner ? `/api/vessels?owner=${encodeURIComponent(owner)}` : "/api/vessels";
  const rows = await apiGet<ApiVessel[]>(path);
  return rows.map(normalizeApiVessel);
}

export async function apiGetSits(): Promise<Sit[]> {
  const rows = await apiGet<ApiSit[]>("/api/sits");
  return rows.map(normalizeApiSit);
}

export async function apiSaveVessel(vessel: Vessel): Promise<Vessel> {
  const row = await apiPut<ApiVessel>(
    `/api/vessels/${encodeURIComponent(vessel.id)}`,
    vesselToApiBody(vessel),
  );
  return {
    ...normalizeApiVessel(row),
    ownerLanguages: vessel.ownerLanguages,
  };
}

export async function apiDeleteVessel(id: string): Promise<void> {
  try {
    await apiDelete(`/api/vessels/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && error.message === "VESSEL_HAS_SITS") {
      throw new Error("VESSEL_HAS_SITS");
    }
    throw error;
  }
}

export async function apiSaveSit(sit: Sit): Promise<Sit> {
  const row = await apiPut<ApiSit>(`/api/sits/${encodeURIComponent(sit.id)}`, sitToApiBody(sit));
  return {
    ...normalizeApiSit(row),
    sitType: sit.sitType,
    maxGuests: sit.maxGuests,
    nonSmokerRequired: sit.nonSmokerRequired,
    applicationsOpen: sit.applicationsOpen,
  };
}

export async function apiDeleteSit(id: string): Promise<void> {
  await apiDelete(`/api/sits/${encodeURIComponent(id)}`);
}

export async function apiGetApplicationsForSit(sitId: string): Promise<SitApplication[]> {
  const rows = await apiGet<ApiApplication[]>(
    `/api/applications?sitId=${encodeURIComponent(sitId)}`,
  );
  return rows.map(normalizeApiApplication);
}

export async function apiGetApplicationsForUser(userName: string): Promise<SitApplication[]> {
  const rows = await apiGet<ApiApplication[]>(
    `/api/applications?user=${encodeURIComponent(userName)}`,
  );
  return rows.map(normalizeApiApplication);
}

export async function apiSendApplication(input: {
  sitId: string;
  message: string;
  partySize?: number;
  applicant: ApplicationApplicant;
}): Promise<SitApplication> {
  const row = await apiPost<ApiApplication>("/api/applications", {
    sitId: input.sitId,
    message: input.message,
    partySize: input.partySize ?? 1,
    applicant: {
      name: input.applicant.name,
      image: input.applicant.image,
      location: input.applicant.location,
      bio: input.applicant.bio,
      languages: input.applicant.languages,
      preferredCountries: input.applicant.preferredCountries,
      skills: input.applicant.skills,
      yearsExperience: input.applicant.yearsExperience,
      certifications: input.applicant.certifications,
      memberSince: input.applicant.memberSince,
      completedSits: input.applicant.completedSits,
    },
  });
  return normalizeApiApplication(row);
}

export async function apiUpdateApplicationStatus(
  applicationId: string,
  status: Exclude<ApplicationStatus, "withdrawn">,
  ownerPhone?: string,
): Promise<SitApplication> {
  const row = await apiPatch<ApiApplication>(
    `/api/applications/${encodeURIComponent(applicationId)}`,
    { status, ...(ownerPhone ? { ownerPhone } : {}) },
  );
  return normalizeApiApplication(row);
}

export async function apiWithdrawApplication(
  applicationId: string,
  explanation?: string,
): Promise<SitApplication> {
  const row = await apiPost<ApiApplication>(
    `/api/applications/${encodeURIComponent(applicationId)}/withdraw`,
    { explanation: explanation ?? "" },
  );
  return normalizeApiApplication(row);
}

export async function apiSendApplicationMessage(
  applicationId: string,
  text: string,
): Promise<SitApplication> {
  const row = await apiPost<ApiApplication>(
    `/api/applications/${encodeURIComponent(applicationId)}/messages`,
    { text },
  );
  return normalizeApiApplication(row);
}

export async function apiShareApplicationPhone(
  applicationId: string,
  phoneNumber: string,
): Promise<SitApplication> {
  const row = await apiPost<ApiApplication>(
    `/api/applications/${encodeURIComponent(applicationId)}/phone`,
    { phoneNumber },
  );
  return normalizeApiApplication(row);
}

export async function apiGetSitPrivateAccess(
  sitId: string,
): Promise<{
  wifiNetwork?: string;
  wifiPassword?: string;
  accessCodes?: string;
  otherNotes?: string;
  fullAddress?: string;
} | null> {
  return apiGet(`/api/sits/${encodeURIComponent(sitId)}/access`);
}

export async function apiRequestApplicationVideoCall(
  applicationId: string,
  proposal: { startsAt: string; durationMinutes: number },
  options?: { counter?: boolean },
): Promise<SitApplication> {
  const row = await apiPost<ApiApplication>(
    `/api/applications/${encodeURIComponent(applicationId)}/video-call`,
    {
      startsAt: proposal.startsAt,
      durationMinutes: proposal.durationMinutes,
      counter: Boolean(options?.counter),
    },
  );
  return normalizeApiApplication(row);
}

export async function apiAcceptApplicationVideoCall(
  applicationId: string,
  messageId: string,
): Promise<SitApplication> {
  const row = await apiPost<ApiApplication>(
    `/api/applications/${encodeURIComponent(applicationId)}/video-call/${encodeURIComponent(messageId)}/accept`,
  );
  return normalizeApiApplication(row);
}

export async function apiDeclineApplicationVideoCall(
  applicationId: string,
  messageId: string,
): Promise<SitApplication> {
  const row = await apiPost<ApiApplication>(
    `/api/applications/${encodeURIComponent(applicationId)}/video-call/${encodeURIComponent(messageId)}/decline`,
  );
  return normalizeApiApplication(row);
}

export async function apiUploadImage(blob: Blob, filename = "image.webp"): Promise<string> {
  const form = new FormData();
  form.append("file", blob, filename);
  const res = await fetch("/api/uploads", {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const body = (await res.json().catch(() => null)) as
    | { data?: { url?: string }; error?: string }
    | null;
  if (!res.ok) {
    throw new ApiError(res.status, body?.error || res.statusText, body);
  }
  const url = body?.data?.url;
  if (!url) throw new ApiError(500, "UPLOAD_FAILED", body);
  return url;
}

export type ApiUserPrefs = {
  saved: string[];
  archivedConversations: string[];
  archivedSits: string[];
  blockedUsers: Array<{ name: string; image: string; blockedAt: string }>;
  userReports: Array<{
    id: string;
    targetName: string;
    reason: string;
    details: string;
    createdAt: string;
    escalated?: boolean;
    applicationId?: string;
    boatName?: string;
    messageId?: string;
    messageText?: string;
    messageCreatedAt?: string;
  }>;
};

export async function apiGetPrefs(): Promise<ApiUserPrefs> {
  return apiGet<ApiUserPrefs>("/api/prefs");
}

export async function apiGetSavedListings(
  availability: "open" | "all" = "open",
): Promise<Boat[]> {
  const qs = availability === "all" ? "?availability=all" : "?availability=open";
  const rows = await apiGet<ApiBoat[]>(`/api/prefs/saved/listings${qs}`);
  return rows.map(normalizeApiBoat);
}

export async function apiSetSaved(sitId: string, saved: boolean): Promise<void> {
  const path = `/api/prefs/saved/${encodeURIComponent(sitId)}`;
  if (saved) await apiPut(path, {});
  else await apiDelete(path);
}

export async function apiSetArchivedConversation(
  applicationId: string,
  archived: boolean,
): Promise<void> {
  const path = `/api/prefs/archived-conversations/${encodeURIComponent(applicationId)}`;
  if (archived) await apiPut(path, {});
  else await apiDelete(path);
}

export async function apiSetArchivedSit(sitId: string, archived: boolean): Promise<void> {
  const path = `/api/prefs/archived-sits/${encodeURIComponent(sitId)}`;
  if (archived) await apiPut(path, {});
  else await apiDelete(path);
}

export async function apiBlockUser(input: { name: string; image: string }): Promise<void> {
  await apiPost("/api/prefs/blocks", input);
}

export async function apiUnblockUser(name: string): Promise<void> {
  await apiDelete(`/api/prefs/blocks/${encodeURIComponent(name)}`);
}

export async function apiCreateUserReport(input: {
  targetName: string;
  reason: string;
  details: string;
  escalated?: boolean;
  applicationId?: string;
  boatName?: string;
  messageId?: string;
  messageText?: string;
  messageCreatedAt?: string;
}): Promise<ApiUserPrefs["userReports"][number]> {
  return apiPost("/api/prefs/reports", input);
}

export async function apiSubmitSupportRequest(
  request: Omit<SupportRequest, "createdAt">,
): Promise<SupportRequest> {
  return apiPost<SupportRequest>("/api/support", request);
}

export async function apiGetProfile(): Promise<ApiProfile> {
  return apiGet<ApiProfile>("/api/me/profile");
}

export async function apiUpdateProfile(patch: Partial<ApiProfile>): Promise<ApiProfile> {
  return apiPut<ApiProfile>("/api/me/profile", patch);
}

export async function apiDeleteAccount(): Promise<void> {
  await apiDelete("/api/me");
}

export async function apiGetPublicProfile(name: string) {
  return apiGet<{
    name: string;
    image: string;
    coverImage?: string;
    location: string;
    bio: string;
    languages: string[];
    preferredCountries: string[];
    skills: string[];
    yearsExperience: number;
    certifications: string[];
    memberSince: number;
    completedSits: number;
  }>(`/api/profiles/${encodeURIComponent(name)}`);
}

export async function apiGetNotifications(): Promise<ApiNotification[]> {
  return apiGet<ApiNotification[]>("/api/notifications");
}

export async function apiMarkNotificationRead(id: string): Promise<ApiNotification> {
  return apiPost<ApiNotification>(`/api/notifications/${encodeURIComponent(id)}/read`);
}

export async function apiMarkAllNotificationsRead(): Promise<ApiNotification[]> {
  return apiPost<ApiNotification[]>("/api/notifications/read-all");
}

export async function apiGetReviewsForSitter(sitterName: string): Promise<ApiReview[]> {
  return apiGet<ApiReview[]>(`/api/reviews?sitter=${encodeURIComponent(sitterName)}`);
}

export async function apiGetReviewForApplication(applicationId: string): Promise<ApiReview | null> {
  return apiGet<ApiReview | null>(
    `/api/reviews?applicationId=${encodeURIComponent(applicationId)}`,
  );
}

export async function apiCreateReview(input: {
  applicationId: string;
  rating: number;
  text: string;
}): Promise<ApiReview> {
  return apiPost<ApiReview>("/api/reviews", input);
}

export async function apiRespondToReview(input: {
  reviewId: string;
  text: string;
}): Promise<ApiReview> {
  return apiPost<ApiReview>(`/api/reviews/${encodeURIComponent(input.reviewId)}/response`, {
    text: input.text,
  });
}
