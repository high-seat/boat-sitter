import { feetToMetresString, normalizeLengthToMetres } from "@/lengthUtils";
import { getSitPhase, sitDateRangesOverlap, type SitPhase } from "@/dateUtils";
import { lookupCoordinates } from "@/coordinates";
import type { SitListSort } from "../shared/sitsSort";
import {
  apiCreateReview,
  apiDeleteSit,
  apiDeleteVessel,
  apiGetApplicationsForSit,
  apiGetApplicationsForUser,
  apiGetApplicationMessages,
  apiGetBoat,
  apiGetBoats,
  apiGetBoatsPage,
  apiGetSittersPage,
  apiSearchAddresses,
  apiSearchDestinations,
  apiGetNotifications,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
  apiGetPublicProfile,
  apiGetReviewForApplication,
  apiGetReviewsForSitter,
  apiGetReviewsForOwner,
  apiGetSavedListings,
  apiGetSitPrivateAccess,
  apiGetSits,
  apiGetVessels,
  apiAcceptApplicationVideoCall,
  apiDeclineApplicationVideoCall,
  apiRequestApplicationVideoCall,
  apiRespondToReview,
  apiSaveSit,
  apiSaveVessel,
  apiInviteSitter,
  apiAcceptInvite,
  apiDeclineInvite,
  apiSendApplication,
  apiSendApplicationMessage,
  apiShareApplicationPhone,
  apiStartSitEarly,
  apiEndSitEarly,
  apiCancelSit,
  apiSubmitSupportRequest,
  apiUpdateApplicationStatus,
  apiWithdrawApplication,
  type ApiApplicationMessage,
  type ApiMessagesPage,
} from "@/apiRemote";
import { ApiError } from "@/apiClient";
import { type ApplicationsListParams } from "../shared/applicationsSearch";
import { type AddressSearchParams, type AddressSuggestion } from "../shared/addressSearch";
import { type BoatSearchParams } from "../shared/boatsSearch";
import { type SitterSearchItem, type SitterSearchParams } from "../shared/sittersSearch";
import { type DestinationSearchParams } from "../shared/destinationsSearch";
import type { Destination } from "@/destinations";

export type { SitPhase };
export { getSitPhase, SIT_PHASES, sitDateRangesOverlap } from "@/dateUtils";

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

export type BoatPhoto = {
  url: string;
  caption?: string;
  /** CSS object-position value, e.g. "center 35%" */
  focus?: string;
};

export function normalizeBoatPhoto(entry: string | BoatPhoto): BoatPhoto {
  if (typeof entry === "string") return { url: entry };
  const caption = entry.caption?.trim();
  const focus = entry.focus?.trim();
  return {
    url: entry.url,
    ...(caption ? { caption } : {}),
    ...(focus ? { focus } : {}),
  };
}

export function normalizeGallery(
  gallery: Array<string | BoatPhoto> | undefined | null,
): BoatPhoto[] {
  return (gallery ?? []).map(normalizeBoatPhoto);
}

export type Boat = {
  id: string;
  boatId?: string;
  name: string;
  type: string;
  length: string;
  /** Year of manufacture; null when unknown. */
  yearBuilt?: number | null;
  location: string;
  country: string;
  latitude: number;
  longitude: number;
  /** When true or unset, the map pin is city-level only. */
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
  /** Whether the sitter stays aboard or just does daily visits. Defaults to liveaboard. */
  sitType?: SitType;
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
  /** When true, sitters must be non-smokers. */
  nonSmokerRequired?: boolean;
  /** True when an application for this sit has been accepted. */
  accepted?: boolean;
  /** When false, sitters cannot submit new applications. Defaults to true. */
  applicationsOpen?: boolean;
  /** Derived lifecycle phase for this sit. */
  phase?: SitPhase;
  /**
   * Typical owner reply latency from application chats.
   * Only present on detail payloads when enough reply samples exist.
   */
  ownerResponseTime?:
    | "withinHour"
    | "withinTwoHours"
    | "withinHalfDay"
    | "withinDay"
    | "withinTwoDays"
    | "withinFewDays"
    | null;
};

/** Details such as Wi-Fi and access codes; never included on public Boat listings. */
export type VesselPrivateAccess = {
  wifiNetwork?: string;
  wifiPassword?: string;
  accessCodes?: string;
  otherNotes?: string;
};

export type Vessel = Pick<
  Boat,
  | "id"
  | "name"
  | "type"
  | "length"
  | "yearBuilt"
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
  /** Full street/marina address; owner-only on vessel GET, shared via sit /access. */
  fullAddress?: string;
  privateAccess?: VesselPrivateAccess;
};

export function hasVesselPrivateAccess(details?: VesselPrivateAccess | null) {
  if (!details) return false;
  return Boolean(
    details.wifiNetwork?.trim() ||
    details.wifiPassword?.trim() ||
    details.accessCodes?.trim() ||
    details.otherNotes?.trim(),
  );
}

/** Sit-level private details (vessel access plus optional full address). */
export type SitPrivateDetails = VesselPrivateAccess & {
  fullAddress?: string;
};

export function hasSitPrivateDetails(details?: SitPrivateDetails | null) {
  return hasVesselPrivateAccess(details) || Boolean(details?.fullAddress?.trim());
}

export function normalizeVesselPrivateAccess(
  details?: VesselPrivateAccess | null,
): VesselPrivateAccess | undefined {
  if (!details) return undefined;
  const normalized: VesselPrivateAccess = {
    ...(details.wifiNetwork?.trim() ? { wifiNetwork: details.wifiNetwork.trim() } : {}),
    ...(details.wifiPassword?.trim() ? { wifiPassword: details.wifiPassword.trim() } : {}),
    ...(details.accessCodes?.trim() ? { accessCodes: details.accessCodes.trim() } : {}),
    ...(details.otherNotes?.trim() ? { otherNotes: details.otherNotes.trim() } : {}),
  };
  return hasVesselPrivateAccess(normalized) ? normalized : undefined;
}

export type SitType = "liveaboard" | "daytimeChecks";

export type Sit = {
  id: string;
  boatId: string;
  dates: string;
  dateStart: string;
  duration: string;
  location: string;
  country: string;
  latitude: number;
  longitude: number;
  /** When true or unset, the map pin is city-level only. */
  approximateLocation?: boolean;
  /**
   * Full street / marina berth address. Never included on public listings;
   * shared only with the owner and accepted applicants.
   */
  fullAddress?: string;
  /** Whether the sitter stays aboard or just does daily visits. Defaults to liveaboard. */
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
  /** When true, sitters must be non-smokers. */
  nonSmokerRequired?: boolean;
  accepted?: boolean;
  /** When false, sitters cannot submit new applications. Defaults to true. */
  applicationsOpen?: boolean;
  /** ISO timestamp when the owner cancelled an underway sit. */
  cancelledAt?: string | null;
  /** Derived lifecycle phase for this sit. */
  phase?: SitPhase;
};

/** @deprecated Prefer resolveListingCoordinates — kept for seed helpers. */
export function coordinatesForLocation(location: string, country: string) {
  return lookupCoordinates(location, country) ?? { latitude: 0, longitude: 0 };
}

function unsplashBoatCover(photoId: string, focus?: { x?: number; y?: number }) {
  const params = new URLSearchParams({
    auto: "format",
    fit: "crop",
    crop: "focalpoint",
    w: "1400",
    q: "85",
  });
  if (focus?.x !== undefined) params.set("fp-x", String(focus.x));
  if (focus?.y !== undefined) params.set("fp-y", String(focus.y));
  return `https://images.unsplash.com/${photoId}?${params.toString()}`;
}

/** One distinct cover per listing. Indices 0–5 are handcrafted; 6–55 are generated boats. */
const UNIQUE_BOAT_COVERS = [
  unsplashBoatCover("photo-1540946485063-a40da27545f8", { x: 0.28 }),
  unsplashBoatCover("photo-1569263979104-865ab7cd8d13", { y: 0.35 }),
  unsplashBoatCover("photo-1567899378494-47b22a2ae96a"),
  unsplashBoatCover("photo-1528154291023-a6525fabe5b4", { x: 0.32, y: 0.45 }),
  unsplashBoatCover("photo-1504813205186-380b1235a5d2"),
  unsplashBoatCover("photo-1599943238450-b0edf519982b"),
  unsplashBoatCover("photo-1605281317010-fe5ffe798166"),
  unsplashBoatCover("photo-1523496922380-91d5afba98a3"),
  unsplashBoatCover("photo-1526761122248-c31c93f8b2b9"),
  unsplashBoatCover("photo-1569282066844-679ec34e3416"),
  unsplashBoatCover("photo-1584772126711-017fae29eadd"),
  unsplashBoatCover("photo-1598737285721-29346a5c9278"),
  unsplashBoatCover("photo-1618131920480-5a853847a2a4"),
  unsplashBoatCover("photo-1622789094987-d75a22f934c4"),
  unsplashBoatCover("photo-1534447677768-be436bb09401"),
  unsplashBoatCover("photo-1444487233259-dae9d907a740"),
  unsplashBoatCover("photo-1509295433237-4b4851f2ab67"),
  unsplashBoatCover("photo-1522440266570-2a733961e09c"),
  unsplashBoatCover("photo-1546214755-c5d22447b43b"),
  unsplashBoatCover("photo-1558268295-a713169178e1"),
  "https://images.pexels.com/photos/273886/pexels-photo-273886.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/540518/pexels-photo-540518.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/237272/pexels-photo-237272.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/42091/pexels-photo-42091.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1167021/pexels-photo-1167021.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/144634/pexels-photo-144634.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1295036/pexels-photo-1295036.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/813011/pexels-photo-813011.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1838569/pexels-photo-1838569.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/2115367/pexels-photo-2115367.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/239548/pexels-photo-239548.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/296281/pexels-photo-296281.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/355288/pexels-photo-355288.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/358319/pexels-photo-358319.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/416676/pexels-photo-416676.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1117210/pexels-photo-1117210.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1430677/pexels-photo-1430677.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1485894/pexels-photo-1485894.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1632365/pexels-photo-1632365.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/169647/pexels-photo-169647.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/171389/pexels-photo-171389.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/221457/pexels-photo-221457.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/240040/pexels-photo-240040.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/296278/pexels-photo-296278.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/3250613/pexels-photo-3250613.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/3293148/pexels-photo-3293148.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/332676/pexels-photo-332676.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/460633/pexels-photo-460633.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/4913309/pexels-photo-4913309.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/4913310/pexels-photo-4913310.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/4913311/pexels-photo-4913311.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/5117913/pexels-photo-5117913.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/5117920/pexels-photo-5117920.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/5117921/pexels-photo-5117921.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/5117922/pexels-photo-5117922.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/51767/pexels-photo-51767.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/552779/pexels-photo-552779.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/561463/pexels-photo-561463.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/163236/luxury-yacht-boat-speed-water-163236.jpeg?auto=compress&cs=tinysrgb&w=1400",
];

const HANDCRAFTED_COVER_INDEX: Record<string, number> = {
  solstice: 0,
  "blue-hour": 1,
  mistral: 2,
  "little-wren": 3,
  "north-star": 4,
  "sea-glass": 5,
};

function coverIndexForVesselId(id: string) {
  if (id in HANDCRAFTED_COVER_INDEX) return HANDCRAFTED_COVER_INDEX[id];
  const match = /^generated-boat-(\d+)$/.exec(id);
  if (match) return 6 + (Number(match[1]) - 1);
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % UNIQUE_BOAT_COVERS.length;
}

function uniqueCoverForVesselId(id: string) {
  return UNIQUE_BOAT_COVERS[coverIndexForVesselId(id) % UNIQUE_BOAT_COVERS.length];
}

function secondaryGalleryForVesselId(id: string) {
  const index = (coverIndexForVesselId(id) + 17) % UNIQUE_BOAT_COVERS.length;
  return UNIQUE_BOAT_COVERS[index];
}

const generatedDestinations = [
  ["Antibes", "France", 43.5804, 7.1251],
  ["Monaco", "Monaco", 43.7384, 7.4246],
  ["Split", "Croatia", 43.5081, 16.4402],
  ["Dubrovnik", "Croatia", 42.6507, 18.0944],
  ["Corfu", "Greece", 39.6243, 19.9217],
  ["Bodrum", "Turkey", 37.0344, 27.4305],
  ["Marmaris", "Turkey", 36.855, 28.2742],
  ["Lisbon", "Portugal", 38.7223, -9.1393],
  ["Lagos", "Portugal", 37.1028, -8.6742],
  ["Barcelona", "Spain", 41.3874, 2.1686],
  ["Valencia", "Spain", 39.4699, -0.3763],
  ["Naples", "Italy", 40.8518, 14.2681],
  ["Sardinia", "Italy", 39.2238, 9.1217],
  ["Malta", "Malta", 35.8989, 14.5146],
  ["Amsterdam", "Netherlands", 52.3676, 4.9041],
  ["Southampton", "United Kingdom", 50.9097, -1.4044],
  ["Auckland", "New Zealand", -36.8509, 174.7645],
  ["Sydney", "Australia", -33.8688, 151.2093],
  ["Nassau", "Bahamas", 25.0443, -77.3504],
  ["Road Town", "British Virgin Islands", 18.4285, -64.6185],
  ["Fort Lauderdale", "United States", 26.1224, -80.1373],
  ["San Diego", "United States", 32.7157, -117.1611],
  ["Annapolis", "United States", 38.9784, -76.4922],
  ["Victoria", "Canada", 48.4284, -123.3656],
  ["Cartagena", "Colombia", 10.391, -75.4794],
] as const;

const generatedBoatNamePrefixes = [
  "Azure",
  "Silver",
  "Golden",
  "Quiet",
  "Wild",
  "Ocean",
  "Harbor",
  "Island",
  "Northern",
  "Southern",
] as const;

const generatedBoatNameSuffixes = ["Tide", "Compass", "Lark", "Horizon", "Dolphin"] as const;

const generatedBoatTypes = [
  "Sailing yacht",
  "Catamaran",
  "Motor yacht",
  "Trawler",
  "Houseboat",
] as const;

export function isNonSmokerRequirementLabel(value: string) {
  return /^non[-\s]?smoker$/i.test(value.trim());
}

export function withoutNonSmokerRequirementLabels(requirements: string[]) {
  return requirements.filter((requirement) => !isNonSmokerRequirementLabel(requirement));
}

export function resolveNonSmokerRequired(sit: {
  nonSmokerRequired?: boolean;
  requirements?: string[];
  requiredSkills?: string[];
}) {
  if (sit.nonSmokerRequired === true) return true;
  if (sit.nonSmokerRequired === false) return false;
  return (
    (sit.requirements ?? []).some(isNonSmokerRequirementLabel) ||
    (sit.requiredSkills ?? []).some(isNonSmokerRequirementLabel)
  );
}

export function isAcceptingApplications(item: { applicationsOpen?: boolean }) {
  return item.applicationsOpen !== false;
}

function enrichSit(sit: Sit, acceptedIds?: Set<string>): Sit {
  const accepted = acceptedIds ? acceptedIds.has(sit.id) : Boolean(sit.accepted);
  const applicationsOpen =
    sit.applicationsOpen != null ? sit.applicationsOpen !== false : !accepted;
  const nonSmokerRequired = resolveNonSmokerRequired(sit);
  return {
    ...sit,
    accepted,
    applicationsOpen,
    nonSmokerRequired,
    requirements: withoutNonSmokerRequirementLabels(sit.requirements),
    requiredSkills: withoutNonSmokerRequirementLabels(sit.requiredSkills ?? []),
    phase: getSitPhase({
      ...sit,
      accepted,
      applicationsOpen,
    }),
  };
}

function splitHomePort(homePort: string) {
  const parts = homePort
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return { location: homePort.trim(), country: "" };
  return {
    location: parts.slice(0, -1).join(", "),
    country: parts.at(-1) ?? "",
  };
}

/** API adapters use loose string enums; cast into the SPA's branded unions. */
function fromApiBoat(boat: Awaited<ReturnType<typeof apiGetBoats>>[number]): Boat {
  return boat as Boat;
}

function fromApiVessel(vessel: Awaited<ReturnType<typeof apiGetVessels>>[number]): Vessel {
  return vessel as Vessel;
}

function fromApiSit(sit: Awaited<ReturnType<typeof apiGetSits>>[number]): Sit {
  return sit as Sit;
}

function fromApiApplication(
  application: Awaited<ReturnType<typeof apiGetApplicationsForUser>>[number],
): SitApplication {
  return application as SitApplication;
}

export async function getBoats(): Promise<Boat[]> {
  const remote = await apiGetBoats();
  return remote.map(fromApiBoat);
}

/** Saved listings for the signed-in shortlist; filter changes hit the server. */
export async function getSavedListings(options: {
  availability: "open" | "all";
  savedIds: string[];
}): Promise<Boat[]> {
  void options.savedIds;
  return (await apiGetSavedListings(options.availability)).map(fromApiBoat);
}

export async function getBoatsPage(params: BoatSearchParams): Promise<{
  boats: Boat[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const remote = await apiGetBoatsPage(params);
  return {
    ...remote,
    boats: remote.boats.map(fromApiBoat),
  };
}

export async function getSittersPage(params: SitterSearchParams): Promise<{
  sitters: SitterSearchItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  return apiGetSittersPage(params);
}

export async function searchDestinations(
  params: DestinationSearchParams = {},
): Promise<Destination[]> {
  return apiSearchDestinations(params);
}

export async function searchAddresses(
  params: AddressSearchParams = {},
): Promise<AddressSuggestion[]> {
  return apiSearchAddresses(params);
}

export async function getBoat(id: string): Promise<Boat | undefined> {
  const remote = await apiGetBoat(id);
  return remote ? fromApiBoat(remote) : undefined;
}

export async function getVessels(): Promise<Vessel[]> {
  return (await apiGetVessels()).map(fromApiVessel);
}

export async function getSits(sort?: SitListSort): Promise<Sit[]> {
  const remote = await apiGetSits(sort);
  return remote.map(fromApiSit).map((sit) => enrichSit(sit));
}

export async function saveVessel(vessel: Vessel): Promise<Vessel> {
  const privateAccess = normalizeVesselPrivateAccess(vessel.privateAccess);
  const fullAddress = vessel.fullAddress?.trim() || undefined;
  const normalized: Vessel = {
    ...vessel,
    length: vessel.length ? normalizeLengthToMetres(vessel.length) : "",
    yearBuilt: vessel.yearBuilt ?? null,
    gallery: normalizeGallery(vessel.gallery),
    ...(fullAddress ? { fullAddress } : { fullAddress: undefined }),
    ...(privateAccess ? { privateAccess } : { privateAccess: undefined }),
  };
  if (!fullAddress) {
    delete normalized.fullAddress;
  }
  if (!privateAccess) {
    delete normalized.privateAccess;
  }
  return fromApiVessel(await apiSaveVessel(normalized));
}

/** Private Wi-Fi / access codes / full address for a sit; owner, or accepted sitter while underway. */
export async function getSitPrivateAccessForViewer(
  sitId: string,
  _viewerName: string,
): Promise<SitPrivateDetails | undefined> {
  try {
    const details = await apiGetSitPrivateAccess(sitId);
    if (!details) return undefined;
    return hasSitPrivateDetails(details) ? details : undefined;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      return undefined;
    }
    throw error;
  }
}

export async function deleteVessel(id: string): Promise<void> {
  await apiDeleteVessel(id);
}

/** Profile name/image changes; vessel denormalization is handled server-side. */
export async function updateOwnerOnVessels(
  _previousName: string,
  _owner: { name: string; image: string; languages: string[] },
): Promise<void> {
  // No client-side domain store to update.
}

export async function saveSit(
  sit: Sit,
  options?: {
    creator?: { name: string; email?: string; phoneNumber?: string };
  },
): Promise<Sit> {
  const normalized: Sit = {
    ...sit,
    fullAddress: sit.fullAddress?.trim() || undefined,
    nonSmokerRequired: Boolean(sit.nonSmokerRequired),
    requirements: withoutNonSmokerRequirementLabels(sit.requirements),
    requiredSkills: withoutNonSmokerRequirementLabels(sit.requiredSkills ?? []),
  };

  const currentRemote = await apiGetSits();
  const exists = currentRemote.some((item) => item.id === normalized.id);
  if (!exists) {
    const { getFeatureFlag } = await import("@/featureFlags");
    if (getFeatureFlag("requireVerificationToSit")) {
      const creator = options?.creator;
      if (!creator?.name) {
        throw new Error("SIT_VERIFICATION_REQUIRED");
      }
      const { requireMemberVerified } = await import("@/verificationService");
      await requireMemberVerified(
        creator.name,
        { email: creator.email, phoneNumber: creator.phoneNumber },
        "SIT_VERIFICATION_REQUIRED",
      );
    }
  }
  return fromApiSit(await apiSaveSit(normalized));
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

/** Dev-only: insert a random vessel owned by the current member. */
export async function createDevRandomVessel(owner: {
  name: string;
  image: string;
  languages?: string[];
}): Promise<Vessel> {
  if (!import.meta.env.DEV) {
    throw new Error("createDevRandomVessel is only available in development");
  }
  const stamp = Date.now().toString(36);
  const id = `dev-boat-${stamp}`;
  const [location, country] = pickRandom(generatedDestinations);
  const type = pickRandom(generatedBoatTypes);
  const name = `${pickRandom(generatedBoatNamePrefixes)} ${pickRandom(generatedBoatNameSuffixes)}`;
  const hasEngine = type !== "Houseboat";
  const vessel: Vessel = {
    id,
    name,
    type,
    length: feetToMetresString(28 + Math.floor(Math.random() * 40)),
    yearBuilt: 1990 + Math.floor(Math.random() * 35),
    homePort: `${location}, ${country}`,
    image: uniqueCoverForVesselId(id),
    gallery: [{ url: secondaryGalleryForVesselId(id) }],
    owner: owner.name,
    ownerLanguages: owner.languages?.length ? [...owner.languages] : ["English"],
    ownerImage: owner.image,
    rating: 0,
    reviews: 0,
    description: `${name} is a freshly listed ${type.toLowerCase()} ready for trusted boat care.`,
    home: "A practical layout with a usable galley, bunk space and easy marina access.",
    systems: hasEngine
      ? ["Diesel engine", "Shore power", "Battery monitor", "Fresh-water system"]
      : ["Shore power", "Battery monitor", "Holding tank", "Fresh-water connection"],
    engineType: hasEngine ? "Inboard diesel" : "No engine",
    voltageType: Math.random() > 0.5 ? "12 V DC" : "24 V DC",
    stoveFuelType: Math.random() > 0.5 ? "LPG / propane" : "Electric / induction",
    amenities: ["Bathroom", "Full kitchen", "Wi-Fi", "Shore power", "Gated access"],
  };
  return saveVessel(vessel);
}

/** Dev-only: insert a random open sit for one of the owner's boats. */
export async function createDevRandomSit(owner: {
  name: string;
  email?: string;
  phoneNumber?: string;
  boatId?: string;
}): Promise<Sit> {
  if (!import.meta.env.DEV) {
    throw new Error("createDevRandomSit is only available in development");
  }
  const vessels = (await apiGetVessels()).filter((vessel) => vessel.owner === owner.name);
  const vessel = owner.boatId
    ? vessels.find((item) => item.id === owner.boatId)
    : pickRandom(vessels);
  if (!vessel) {
    throw new Error("NO_OWNER_BOAT");
  }
  const stamp = Date.now().toString(36);
  const id = `dev-sit-${stamp}`;
  const startOffsetDays = 14 + Math.floor(Math.random() * 120);
  const nights = 7 + Math.floor(Math.random() * 21);
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() + startOffsetDays);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + nights);
  const displayDate = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const homePort = splitHomePort(vessel.homePort);
  const location = homePort.location || "Harbor town";
  const country = homePort.country || "Unknown";
  const coordinates = coordinatesForLocation(location, country);
  const sit: Sit = {
    id,
    boatId: vessel.id,
    dateStart: start.toISOString().slice(0, 10),
    dates: `${displayDate.format(start)} – ${displayDate.format(end)}`,
    duration: `${nights} nights`,
    location,
    country,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    approximateLocation: true,
    sitType: Math.random() > 0.35 ? "liveaboard" : "daytimeChecks",
    responsibilities: [
      "Check lines, fenders and bilges each day",
      "Monitor shore power and battery levels",
      "Send the owner a short weekly update",
    ],
    requirements: [],
    minYearsExperience: 0,
    requiredExperience: [],
    requiredCertifications: [],
    requiredSkills: [],
    maxGuests: 1 + Math.floor(Math.random() * 3),
    applicants: 0,
    nonSmokerRequired: Math.random() > 0.6,
    applicationsOpen: true,
  };
  // Write via API directly so DEV seeding is not blocked by identity verification gates.
  return fromApiSit(await apiSaveSit(sit));
}

export async function deleteSit(id: string): Promise<void> {
  const sits = await apiGetSits();
  const sit = sits.find((item) => item.id === id);
  if (!sit) return;
  const accepted = Boolean(sit.accepted);
  const phase = getSitPhase({
    dateStart: sit.dateStart,
    duration: sit.duration,
    applicationsOpen: sit.applicationsOpen,
    accepted,
    applicants: sit.applicants,
  });
  if (phase === "stayUnderway") {
    throw new Error("SIT_IS_UNDERWAY");
  }
  if (phase === "stayCompleted") {
    throw new Error("SIT_IS_COMPLETED");
  }
  await apiDeleteSit(id);
}

export async function startSitEarly(id: string): Promise<Sit> {
  return fromApiSit(await apiStartSitEarly(id));
}

export async function endSitEarly(id: string): Promise<Sit> {
  return fromApiSit(await apiEndSitEarly(id));
}

export async function cancelSit(
  id: string,
  options: { reopenApplications?: boolean } = {},
): Promise<Sit> {
  return fromApiSit(await apiCancelSit(id, options));
}

export type ApplicationStatus =
  | "new"
  | "shortlisted"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "invited";
export type MockNotification = {
  actor?: string;
  boatName?: string;
  createdAt: string;
  href: string;
  id: string;
  read?: boolean;
  type:
    | "applicationAccepted"
    | "applicationDeclined"
    | "applicationUnaccepted"
    | "availabilityMatch"
    | "availabilitySitsFound"
    | "newApplication"
    | "newMessage"
    | "sitInvite"
    | "sitAccepted"
    | "sitCancelled"
    | "sitEndedEarly"
    | "sitReminder"
    | "sitSittersFound"
    | "welcome";
};

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
  memberSince: number;
  completedSits: number;
};

export type ApplicationMessage = {
  id: string;
  senderName: string;
  text: string;
  createdAt: string;
  kind?: "user" | "system";
  systemKind?:
    | "accepted"
    | "declined"
    | "unaccepted"
    | "applicantsClosed"
    | "videoCallRequest"
    | "videoCallCounter"
    | "videoCallAccepted"
    | "videoCallDeclined"
    | "phoneShared"
    | "withdrawn"
    | "sitCancelled"
    | "sitEndedEarly"
    | "inviteAccepted"
    | "inviteDeclined";
  videoCall?: {
    startsAt: string;
    durationMinutes: number;
    meetUrl?: string;
  };
  /** Profile phone shared into the thread (E.164-ish display string). */
  sharedPhone?: string;
  /** Client-only: message is shown optimistically while the send request is in flight. */
  pending?: boolean;
};

export type SitApplication = {
  id: string;
  sitId: string;
  boatName: string;
  ownerName: string;
  /** Profile photo for the boat owner; used when the sitter views the thread. */
  ownerImage?: string;
  applicant: ApplicationApplicant;
  partySize: number;
  initialMessage: string;
  status: ApplicationStatus;
  /** True when the owner invited this sitter (survives accept → new). */
  invited?: boolean;
  createdAt: string;
  messages: ApplicationMessage[];
  ownerPhone?: string;
  /** Total messages in the conversation (for pagination). */
  totalMessages?: number;
};

export function containsOffPlatformContactDetails(message: string) {
  const containsEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(message);
  const phoneCandidates = message.match(/(?:\+?\d[\d\s().-]{5,}\d)/g) ?? [];
  const containsPhone = phoneCandidates.some((candidate) => {
    const compact = candidate.trim();
    const looksLikeDate =
      /^\d{4}[-.\s]\d{1,2}[-.\s]\d{1,2}$/.test(compact) ||
      /^\d{1,2}[-.\s]\d{1,2}[-.\s]\d{2,4}$/.test(compact);
    return !looksLikeDate && compact.replaceAll(/\D/g, "").length >= 7;
  });
  return containsEmail || containsPhone;
}

export type ConfirmedSitDateConflict = {
  sitId: string;
  boatName: string;
};

/** Another accepted sit for this sitter whose dates overlap the target sit. */
export function findConfirmedSitDateConflict(
  applications: SitApplication[],
  sits: Array<{ id: string; dateStart: string; duration: string }>,
  applicantName: string,
  target: { id: string; dateStart: string; duration: string },
): ConfirmedSitDateConflict | undefined {
  for (const application of applications) {
    if (
      application.applicant.name !== applicantName ||
      application.status !== "accepted" ||
      application.sitId === target.id
    ) {
      continue;
    }
    const sit = sits.find((item) => item.id === application.sitId);
    if (!sit) continue;
    if (sitDateRangesOverlap(sit, target)) {
      return { sitId: sit.id, boatName: application.boatName };
    }
  }
  return undefined;
}

export async function sendApplication(
  sitId: string,
  message: string,
  partySize: number,
  applicant: Omit<ApplicationApplicant, "yearsExperience" | "certifications" | "completedSits"> & {
    yearsExperience?: number;
    certifications?: string[];
    completedSits?: number;
    email?: string;
    phoneNumber?: string;
  },
) {
  if (containsOffPlatformContactDetails(message)) {
    throw new Error("APPLICATION_CONTACT_DETAILS_NOT_ALLOWED");
  }
  const { getFeatureFlag } = await import("@/featureFlags");
  if (getFeatureFlag("requireVerificationToSit")) {
    const { requireApplicantVerified } = await import("@/verificationService");
    await requireApplicantVerified(applicant.name, {
      email: applicant.email,
      phoneNumber: applicant.phoneNumber,
    });
  }

  const applicantProfile = {
    name: applicant.name,
    image: applicant.image,
    location: applicant.location,
    bio: applicant.bio,
    languages: applicant.languages,
    preferredCountries: applicant.preferredCountries,
    skills: applicant.skills,
    memberSince: applicant.memberSince,
    yearsExperience: applicant.yearsExperience ?? 0,
    certifications: applicant.certifications ?? [],
    completedSits: applicant.completedSits ?? 0,
  };

  try {
    return fromApiApplication(
      await apiSendApplication({
        sitId,
        message: message.trim(),
        partySize,
        applicant: applicantProfile,
      }),
    );
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.message === "APPLICATION_SIT_NOT_FOUND")
        throw new Error("APPLICATION_SIT_NOT_FOUND");
      if (error.message === "APPLICATIONS_CLOSED") throw new Error("APPLICATIONS_CLOSED");
    }
    throw error;
  }
}

/** Owner invites a sitter whose availability overlaps an open sit. */
export async function inviteSitterToSit(sitId: string, sitterName: string, message: string) {
  if (containsOffPlatformContactDetails(message)) {
    throw new Error("APPLICATION_CONTACT_DETAILS_NOT_ALLOWED");
  }
  try {
    return fromApiApplication(
      await apiInviteSitter({
        sitId,
        sitterName,
        message: message.trim(),
      }),
    );
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.message === "APPLICATION_SIT_NOT_FOUND")
        throw new Error("APPLICATION_SIT_NOT_FOUND");
      if (error.message === "APPLICATIONS_CLOSED") throw new Error("APPLICATIONS_CLOSED");
      if (error.message === "SITTER_NOT_FOUND") throw new Error("SITTER_NOT_FOUND");
      if (error.message === "FORBIDDEN") throw new Error("FORBIDDEN");
    }
    throw error;
  }
}

export async function acceptSitInvite(applicationId: string): Promise<SitApplication> {
  try {
    return fromApiApplication(await apiAcceptInvite(applicationId));
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.message === "APPLICATION_NOT_FOUND") throw new Error("APPLICATION_NOT_FOUND");
      if (error.message === "INVITE_NOT_PENDING") throw new Error("INVITE_NOT_PENDING");
      if (error.message === "FORBIDDEN") throw new Error("FORBIDDEN");
    }
    throw error;
  }
}

export async function declineSitInvite(applicationId: string): Promise<SitApplication> {
  try {
    return fromApiApplication(await apiDeclineInvite(applicationId));
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.message === "APPLICATION_NOT_FOUND") throw new Error("APPLICATION_NOT_FOUND");
      if (error.message === "INVITE_NOT_PENDING") throw new Error("INVITE_NOT_PENDING");
      if (error.message === "FORBIDDEN") throw new Error("FORBIDDEN");
    }
    throw error;
  }
}

export async function getApplicationsForSit(
  sitId: string,
  params?: Omit<ApplicationsListParams, "sitId">,
): Promise<{
  applications: SitApplication[];
  accepted: SitApplication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  sitTotal: number;
}> {
  const result = await apiGetApplicationsForSit(sitId, params);
  return {
    ...result,
    applications: result.applications.map(fromApiApplication),
    accepted: result.accepted.map(fromApiApplication),
  };
}

export async function getApplicationsForUser(userName: string): Promise<SitApplication[]> {
  return (await apiGetApplicationsForUser(userName)).map(fromApiApplication);
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  ownerPhone?: string,
): Promise<SitApplication> {
  if (status === "withdrawn") {
    throw new Error("WITHDRAW_NOT_ALLOWED");
  }
  try {
    return fromApiApplication(await apiUpdateApplicationStatus(applicationId, status, ownerPhone));
  } catch (error) {
    if (error instanceof ApiError && error.message === "APPLICATION_NOT_FOUND") {
      throw new Error("APPLICATION_NOT_FOUND");
    }
    throw error;
  }
}

export async function withdrawApplication(
  applicationId: string,
  _applicantName: string,
  explanation?: string,
): Promise<SitApplication> {
  try {
    return fromApiApplication(await apiWithdrawApplication(applicationId, explanation));
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.message === "APPLICATION_NOT_FOUND") throw new Error("APPLICATION_NOT_FOUND");
      if (error.message === "WITHDRAW_NOT_ALLOWED") throw new Error("WITHDRAW_NOT_ALLOWED");
    }
    throw error;
  }
}

function mapApiNotification(
  item: Awaited<ReturnType<typeof apiGetNotifications>>[number],
): MockNotification {
  return {
    id: item.id,
    type: item.type as MockNotification["type"],
    actor: item.actor,
    boatName: item.boatName,
    href: item.href,
    createdAt: item.createdAt,
    read: Boolean(item.read),
  };
}

export async function getNotificationsForUser(_userName: string): Promise<MockNotification[]> {
  if (typeof localStorage !== "undefined") {
    const delayMs = Number(localStorage.getItem("boatstead-e2e-notification-delay-ms") || 0);
    if (Number.isFinite(delayMs) && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  const remote = await apiGetNotifications();
  return remote.map(mapApiNotification);
}

export async function markNotificationRead(
  notificationId: string,
  _userName: string,
): Promise<MockNotification | undefined> {
  const item = await apiMarkNotificationRead(notificationId);
  return mapApiNotification(item);
}

export async function markAllNotificationsRead(_userName: string): Promise<MockNotification[]> {
  const remote = await apiMarkAllNotificationsRead();
  return remote.map(mapApiNotification);
}

export { type ApiApplicationMessage, type ApiMessagesPage };

export async function getApplicationMessages(
  applicationId: string,
  params?: { limit?: number; before?: string },
): Promise<ApiMessagesPage> {
  return apiGetApplicationMessages(applicationId, params);
}

export async function sendApplicationMessage(
  applicationId: string,
  _senderName: string,
  text: string,
): Promise<SitApplication> {
  try {
    return fromApiApplication(await apiSendApplicationMessage(applicationId, text.trim()));
  } catch (error) {
    if (error instanceof ApiError && error.message === "APPLICATION_NOT_FOUND") {
      throw new Error("APPLICATION_NOT_FOUND");
    }
    throw error;
  }
}

export async function shareApplicationPhoneNumber(
  applicationId: string,
  _senderName: string,
  phoneNumber: string,
): Promise<SitApplication> {
  try {
    return fromApiApplication(await apiShareApplicationPhone(applicationId, phoneNumber));
  } catch (error) {
    if (error instanceof ApiError && error.message === "APPLICATION_NOT_FOUND") {
      throw new Error("APPLICATION_NOT_FOUND");
    }
    if (error instanceof ApiError && error.message === "PHONE_NUMBER_REQUIRED") {
      throw new Error("PHONE_NUMBER_REQUIRED");
    }
    throw error;
  }
}

export async function requestApplicationVideoCall(
  applicationId: string,
  _senderName: string,
  proposal: { startsAt: string; durationMinutes: number },
  options?: { counter?: boolean },
): Promise<SitApplication> {
  try {
    return fromApiApplication(
      await apiRequestApplicationVideoCall(applicationId, proposal, options),
    );
  } catch (error) {
    if (error instanceof ApiError && error.message === "APPLICATION_NOT_FOUND") {
      throw new Error("APPLICATION_NOT_FOUND");
    }
    if (error instanceof ApiError && error.message === "VIDEO_CALL_TIME_PAST") {
      throw new Error("VIDEO_CALL_TIME_PAST");
    }
    throw error;
  }
}

export async function acceptApplicationVideoCall(
  applicationId: string,
  _senderName: string,
  messageId: string,
): Promise<SitApplication> {
  try {
    return fromApiApplication(await apiAcceptApplicationVideoCall(applicationId, messageId));
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.message === "APPLICATION_NOT_FOUND") throw new Error("APPLICATION_NOT_FOUND");
      if (error.message === "VIDEO_CALL_PROPOSAL_NOT_FOUND") {
        throw new Error("VIDEO_CALL_PROPOSAL_NOT_FOUND");
      }
      if (error.message === "VIDEO_CALL_CANNOT_ACCEPT_OWN") {
        throw new Error("VIDEO_CALL_CANNOT_ACCEPT_OWN");
      }
    }
    throw error;
  }
}

export async function declineApplicationVideoCall(
  applicationId: string,
  _senderName: string,
  messageId: string,
): Promise<SitApplication> {
  try {
    return fromApiApplication(await apiDeclineApplicationVideoCall(applicationId, messageId));
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.message === "APPLICATION_NOT_FOUND") throw new Error("APPLICATION_NOT_FOUND");
      if (error.message === "VIDEO_CALL_PROPOSAL_NOT_FOUND") {
        throw new Error("VIDEO_CALL_PROPOSAL_NOT_FOUND");
      }
      if (error.message === "VIDEO_CALL_CANNOT_DECLINE_OWN") {
        throw new Error("VIDEO_CALL_CANNOT_DECLINE_OWN");
      }
    }
    throw error;
  }
}

export type SupportRequest = {
  topic: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

export async function submitSupportRequest(
  request: Omit<SupportRequest, "createdAt">,
): Promise<SupportRequest> {
  return await apiSubmitSupportRequest(request);
}

export type SitReviewResponse = {
  text: string;
  createdAt: string;
};

export type SitReview = {
  id: string;
  sitId: string;
  boatName: string;
  applicationId: string;
  authorRole?: "owner" | "sitter";
  sitterName: string;
  ownerName: string;
  ownerImage: string;
  authorImage?: string;
  rating: number;
  text: string;
  createdAt: string;
  location: string;
  response?: SitReviewResponse;
};

export type PublicMemberProfile = {
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
};

export type SitterRatingSummary = {
  average: number;
  count: number;
};

export function summarizeSitterRating(reviews: SitReview[]): SitterRatingSummary {
  if (!reviews.length) return { average: 0, count: 0 };
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}

export async function getReviewsForSitter(sitterName: string): Promise<SitReview[]> {
  return (await apiGetReviewsForSitter(sitterName)) as SitReview[];
}

export async function getReviewsForOwner(ownerName: string): Promise<SitReview[]> {
  return (await apiGetReviewsForOwner(ownerName)) as SitReview[];
}

export async function getSitterRatingSummary(sitterName: string): Promise<SitterRatingSummary> {
  const reviews = await getReviewsForSitter(sitterName);
  return summarizeSitterRating(reviews);
}

export async function getReviewForApplication(
  applicationId: string,
  authorRole: "owner" | "sitter" = "owner",
): Promise<SitReview | null> {
  return (await apiGetReviewForApplication(applicationId, authorRole)) as SitReview | null;
}

export async function getPublicMemberProfile(name: string): Promise<PublicMemberProfile | null> {
  try {
    return await apiGetPublicProfile(name);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createReview(input: {
  applicationId: string;
  rating: number;
  text: string;
  ownerName: string;
}): Promise<SitReview> {
  void input.ownerName;
  try {
    return (await apiCreateReview({
      applicationId: input.applicationId,
      rating: input.rating,
      text: input.text,
    })) as SitReview;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function respondToReview(input: {
  reviewId: string;
  text: string;
  sitterName: string;
}): Promise<SitReview> {
  void input.sitterName;
  try {
    return (await apiRespondToReview({
      reviewId: input.reviewId,
      text: input.text,
    })) as SitReview;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
    throw error;
  }
}
