import { feetToMetresString, normalizeLengthToMetres } from "@/lengthUtils";
import {
  getSitPhase,
  isSitCompletedForReview,
  canLeaveReview,
  sitDateRangesOverlap,
  type SitPhase,
} from "@/dateUtils";
import {
  apiCreateReview,
  apiDeleteSit,
  apiDeleteVessel,
  apiGetApplicationsForSit,
  apiGetApplicationsForUser,
  apiGetBoat,
  apiGetBoats,
  apiGetBoatsPage,
  apiGetNotifications,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
  apiGetPublicProfile,
  apiGetReviewForApplication,
  apiGetReviewsForSitter,
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
  apiSendApplication,
  apiSendApplicationMessage,
  apiShareApplicationPhone,
  apiSubmitSupportRequest,
  apiUpdateApplicationStatus,
  apiWithdrawApplication,
  hasApiSession,
} from "@/apiRemote";
import { ApiError } from "@/apiClient";
import {
  APPLICATIONS_PAGE_SIZE,
  paginateApplicationList,
  parseApplicationExperienceFilter,
  parseApplicationListSort,
  parseApplicationStatusFilter,
  prepareApplicationReviewLists,
  type ApplicationsListParams,
} from "../shared/applicationsSearch";
import { paginateBoats, type BoatSearchParams } from "../shared/boatsSearch";

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
  /** Derived lifecycle phase for this sit. */
  phase?: SitPhase;
};

const LOCATION_COORDINATES: Record<string, [number, number]> = {
  bath: [51.3811, -2.359],
  grenada: [12.0561, -61.7488],
  greece: [38.7066, 20.7019],
  lefkada: [38.7066, 20.7019],
  palma: [39.5696, 2.6502],
  sausalito: [37.8591, -122.4853],
  vancouver: [49.2827, -123.1207],
};

export function coordinatesForLocation(location: string, country: string) {
  const searchable = `${location} ${country}`.toLowerCase();
  const match = Object.entries(LOCATION_COORDINATES).find(([name]) => searchable.includes(name));
  const [latitude, longitude] = match?.[1] ?? [20, 0];
  return { latitude, longitude };
}

const DEMO_LISTING_GALLERY: BoatPhoto[] = [
  "https://images.pexels.com/photos/163236/luxury-yacht-boat-speed-water-163236.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/273886/pexels-photo-273886.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/540518/pexels-photo-540518.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/237272/pexels-photo-237272.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/42091/pexels-photo-42091.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/1167021/pexels-photo-1167021.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/144634/pexels-photo-144634.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1600&q=88&fp-x=.25",
  "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=1600&q=88&fp-y=.3",
  "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1600&q=88",
  "https://images.unsplash.com/photo-1528154291023-a6525fabe5b4?auto=format&fit=crop&w=1600&q=88",
  "https://images.unsplash.com/photo-1504813205186-380b1235a5d2?auto=format&fit=crop&w=1600&q=88",
  "https://images.unsplash.com/photo-1599943238450-b0edf519982b?auto=format&fit=crop&w=1600&q=88",
].map((url) => ({ url }));
const RICH_GALLERY_LISTING_IDS = new Set(["solstice", "blue-hour", "mistral"]);

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

const boats: Boat[] = [
  {
    id: "solstice",
    name: "Solstice",
    type: "Sailing yacht",
    length: feetToMetresString(42),
    yearBuilt: 2008,
    location: "Lefkada, Greece",
    country: "Greece",
    latitude: 38.7066,
    longitude: 20.7019,
    homePort: "Lefkada, Greece",
    dates: "12 Sep – 4 Oct",
    dateStart: "2026-09-12",
    duration: "22 nights",
    image: uniqueCoverForVesselId("solstice"),
    gallery: [...DEMO_LISTING_GALLERY],
    owner: "Maya & Finn",
    ownerLanguages: ["English", "French"],
    ownerImage: "https://i.pravatar.cc/160?img=47",
    rating: 4.9,
    reviews: 18,
    applicants: 6,
    description:
      "Solstice is our much-loved bluewater cruiser, tucked into a quiet marina on Lefkada. We need a confident liveaboard to keep her aired, secure and happy while we visit family.",
    home: "Private aft cabin, full galley and a bright saloon. The marina has showers, laundry, a pool and tavernas a short walk away.",
    responsibilities: [
      "Check bilges and battery monitor each morning",
      "Run engine and watermaker weekly",
      "Adjust lines and fenders after strong weather",
      "Flush heads and air cabins regularly",
    ],
    systems: ["Yanmar diesel", "12V / solar", "Watermaker", "Electric windlass"],
    engineType: "Inboard diesel",
    voltageType: "12 V DC",
    stoveFuelType: "LPG / propane",
    requirements: ["5+ years sailing", "Diesel troubleshooting", "Liveaboard experience"],
    amenities: [
      "Bathroom",
      "Full kitchen",
      "Outdoor BBQ",
      "Air conditioning",
      "Wi-Fi",
      "On-site bathrooms & showers",
      "24/7 security",
      "Gated access",
      "On-site laundry",
      "Swimming pool",
      "On-site restaurant",
      "Tender",
      "Paddleboard",
      "Shore power",
    ],
    pet: "Pip, a sea-loving terrier",
    featured: true,
    sitType: "liveaboard",
  },
  {
    id: "blue-hour",
    name: "Blue Hour",
    type: "Catamaran",
    length: feetToMetresString(46),
    yearBuilt: 2015,
    location: "St. George’s, Grenada",
    country: "Grenada",
    latitude: 12.0561,
    longitude: -61.7488,
    homePort: "St. George’s, Grenada",
    dates: "3 Nov – 1 Dec",
    dateStart: "2026-11-03",
    duration: "28 nights",
    image: uniqueCoverForVesselId("blue-hour"),
    gallery: [],
    owner: "Jonas",
    ownerLanguages: ["English", "German"],
    ownerImage: "https://i.pravatar.cc/160?img=12",
    rating: 5,
    reviews: 11,
    applicants: 9,
    description:
      "A spacious Lagoon catamaran on a sheltered mooring. Ideal for a couple who know tropical weather routines and are comfortable using a dinghy.",
    home: "Owner’s hull, island galley, water views from every window and reliable marina Wi-Fi.",
    responsibilities: [
      "Daily mooring and chafe inspection",
      "Monitor solar, batteries and fridge",
      "Start both engines weekly",
      "Secure deck before squalls",
    ],
    systems: ["Twin Yanmar diesels", "Lithium bank", "Solar array", "Dinghy outboard"],
    engineType: "Inboard diesel",
    voltageType: "24 V DC",
    stoveFuelType: "LPG / propane",
    requirements: ["Catamaran experience", "Dinghy handling", "Storm awareness"],
    amenities: [
      "Bathroom",
      "Full kitchen",
      "Outdoor BBQ",
      "Wi-Fi",
      "24/7 security",
      "Gated access",
      "On-site laundry",
      "Tender",
      "Kayak",
      "Swim platform",
    ],
  },
  {
    id: "mistral",
    name: "Mistral",
    type: "Motor yacht",
    length: feetToMetresString(55),
    yearBuilt: 1998,
    location: "Palma, Mallorca",
    country: "Spain",
    latitude: 39.5696,
    longitude: 2.6502,
    homePort: "Palma, Mallorca, Spain",
    dates: "18 Oct – 8 Nov",
    dateStart: "2026-10-18",
    duration: "21 nights",
    image: uniqueCoverForVesselId("mistral"),
    gallery: [],
    owner: "Elena",
    ownerLanguages: ["Spanish", "English", "Italian"],
    ownerImage: "https://i.pravatar.cc/160?img=32",
    rating: 4.8,
    reviews: 24,
    applicants: 12,
    description:
      "Mistral is berthed in central Palma. We are looking for a practical sitter who can keep an eye on systems and coordinate one scheduled engineer visit.",
    home: "Large master cabin, two heads, full galley and flybridge. Cafés and the old town are minutes away.",
    responsibilities: [
      "Daily shore power and bilge checks",
      "Run generator under load weekly",
      "Meet marine engineer for service",
      "Fresh-water washdown after rain",
    ],
    systems: ["Twin Volvo diesels", "Generator", "Hydraulic passerelle", "Blackwater tank"],
    engineType: "Inboard diesel",
    voltageType: "24 V DC",
    stoveFuelType: "Electric / induction",
    requirements: ["Motor yacht experience", "Systems confident", "Non-smoker"],
    amenities: [
      "Bathroom",
      "Full kitchen",
      "Air conditioning",
      "Wi-Fi",
      "24/7 security",
      "Gated access",
      "On-site bathrooms & showers",
      "On-site laundry",
      "Swimming pool",
      "On-site restaurant",
      "Parking",
      "Smart TV",
    ],
  },
  {
    id: "little-wren",
    name: "Little Wren",
    type: "Narrowboat",
    length: feetToMetresString(58),
    yearBuilt: 2012,
    location: "Bath, England",
    country: "United Kingdom",
    latitude: 51.3811,
    longitude: -2.359,
    homePort: "Bath, England, United Kingdom",
    dates: "6 Aug – 20 Aug",
    dateStart: "2026-08-06",
    duration: "14 nights",
    image: uniqueCoverForVesselId("little-wren"),
    gallery: [],
    owner: "Tom & Ada",
    ownerLanguages: ["English"],
    ownerImage: "https://i.pravatar.cc/160?img=5",
    rating: 4.9,
    reviews: 31,
    applicants: 4,
    description:
      "A cosy, characterful narrowboat on a permanent residential mooring just outside Bath, with two easy-going rescue cats aboard.",
    home: "Wood stove, double berth, compact galley, composting loo and a sunny bow deck.",
    responsibilities: [
      "Feed cats morning and evening",
      "Top up water tank as needed",
      "Check mooring pins and ropes",
      "Keep batteries above 60%",
    ],
    systems: ["Canaline diesel", "12V / solar", "Solid fuel stove", "Cassette toilet"],
    engineType: "Inboard diesel",
    voltageType: "12 V DC",
    stoveFuelType: "LPG / propane",
    requirements: ["Boat living experience", "Cat lover", "Comfortable off-grid"],
    amenities: ["Bathroom", "Full kitchen", "Heating", "Wi-Fi", "Bicycles", "Kayak", "Wood stove"],
    pet: "Mackerel & Dot, rescue cats",
  },
  {
    id: "north-star",
    name: "North Star",
    type: "Trawler",
    length: feetToMetresString(48),
    yearBuilt: 2004,
    location: "Vancouver, Canada",
    country: "Canada",
    latitude: 49.2827,
    longitude: -123.1207,
    homePort: "Vancouver, Canada",
    dates: "10 Jan – 7 Feb",
    dateStart: "2027-01-10",
    duration: "28 nights",
    image: uniqueCoverForVesselId("north-star"),
    gallery: [],
    owner: "Clare",
    ownerLanguages: ["English", "French"],
    ownerImage: "https://i.pravatar.cc/160?img=44",
    rating: 5,
    reviews: 8,
    applicants: 3,
    description:
      "A sturdy Nordhavn in a secure marina. Winter care is mainly heat, humidity and line checks, with a detailed handover and local support.",
    home: "Warm pilothouse, diesel heating, marina facilities and mountain views.",
    responsibilities: [
      "Monitor heaters and dehumidifiers",
      "Inspect lines after winter fronts",
      "Check engine room for leaks",
      "Exercise seacocks fortnightly",
    ],
    systems: ["Single Lugger diesel", "Diesel heat", "Generator", "Inverter"],
    engineType: "Inboard diesel",
    voltageType: "24 V DC",
    stoveFuelType: "Diesel",
    requirements: ["Cold-weather boating", "Engine room confidence", "References"],
    amenities: [
      "Bathroom",
      "Full kitchen",
      "Heating",
      "Wi-Fi",
      "24/7 security",
      "Gated access",
      "On-site bathrooms & showers",
      "On-site laundry",
      "On-site restaurant",
      "Parking",
      "Tender",
    ],
  },
  {
    id: "sea-glass",
    name: "Sea Glass",
    type: "Houseboat",
    length: feetToMetresString(62),
    yearBuilt: 2019,
    location: "Sausalito, California",
    country: "United States",
    latitude: 37.8591,
    longitude: -122.4853,
    homePort: "Sausalito, California, United States",
    dates: "2 Sep – 16 Sep",
    dateStart: "2026-09-02",
    duration: "14 nights",
    image: uniqueCoverForVesselId("sea-glass"),
    gallery: [],
    owner: "Rachel",
    ownerLanguages: ["English"],
    ownerImage: "https://i.pravatar.cc/160?img=26",
    rating: 4.7,
    reviews: 15,
    applicants: 7,
    description:
      "A design-led floating home with a tender and two resident hens ashore. No cruising required, just attentive houseboat care.",
    home: "Two bedrooms, chef’s kitchen, roof deck and spectacular bay views.",
    sitType: "daytimeChecks",
    responsibilities: [
      "Check float and utility connections",
      "Water roof planters",
      "Collect mail and feed hens",
      "Keep tender battery charged",
    ],
    systems: ["Shore power", "Holding tank", "Fresh-water connection", "Tender"],
    engineType: "No engine",
    voltageType: "48 V DC",
    stoveFuelType: "Electric / induction",
    requirements: ["Houseboat experience preferred", "Animal friendly", "Non-smoker"],
    amenities: [
      "Bathroom",
      "Full kitchen",
      "Outdoor BBQ",
      "Dedicated workspace",
      "Gated access",
      "On-site laundry",
      "On-site restaurant",
      "Tender",
      "Roof deck",
      "Fiber Wi-Fi",
    ],
  },
];

const nonBoatImageReplacements: Record<string, string> = {
  "https://images.pexels.com/photos/76959/pexels-photo-76959.jpeg?auto=compress&cs=tinysrgb&w=1600":
    "https://images.pexels.com/photos/273886/pexels-photo-273886.jpeg?auto=compress&cs=tinysrgb&w=1600&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1528150177508-7cc0c36cda5c?auto=format&fit=crop&w=1400&q=85":
    UNIQUE_BOAT_COVERS[0],
  "https://images.unsplash.com/photo-1499403474843-04e72c14df8a?auto=format&fit=crop&w=1400&q=85":
    UNIQUE_BOAT_COVERS[1],
  "https://images.unsplash.com/photo-1566847438217-76e82d383f84?auto=format&fit=crop&w=900&q=85":
    UNIQUE_BOAT_COVERS[1],
  "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=85":
    UNIQUE_BOAT_COVERS[2],
};

function ensureBoatImage(image: string) {
  return nonBoatImageReplacements[image] ?? image;
}

function ensureVesselCover(vessel: Pick<Vessel, "id" | "image">) {
  if (vessel.id in HANDCRAFTED_COVER_INDEX || /^generated-boat-\d+$/.test(vessel.id)) {
    return uniqueCoverForVesselId(vessel.id);
  }
  return ensureBoatImage(vessel.image);
}

function withDemoGallery(vessel: Vessel): Vessel {
  if (!RICH_GALLERY_LISTING_IDS.has(vessel.id) || vessel.gallery.length >= 10) return vessel;
  return { ...vessel, gallery: [...DEMO_LISTING_GALLERY] };
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

const generatedOwners = [
  "Amelia & Noah",
  "Sofia",
  "Luca & Emma",
  "Mila",
  "Oliver & James",
  "Ines",
  "Theo & Anna",
  "Nora",
  "Mateo & Isla",
  "Helena",
] as const;

const generatedOwnerLanguages = [
  ["English", "French"],
  ["English", "Spanish"],
  ["Italian", "English"],
  ["Croatian", "English"],
  ["English", "German"],
  ["Portuguese", "English"],
  ["German", "English"],
  ["Dutch", "English"],
  ["Spanish", "English"],
  ["Greek", "English"],
] as const;

function generatedDateDetails(index: number) {
  const absoluteMonth = 7 + index;
  const start = new Date(
    Date.UTC(2026 + Math.floor(absoluteMonth / 12), absoluteMonth % 12, 4 + ((index * 7) % 21)),
  );
  const nights = 7 + ((index * 5) % 29);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + nights);
  const displayDate = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return {
    dateStart: start.toISOString().slice(0, 10),
    dates: `${displayDate.format(start)} – ${displayDate.format(end)}`,
    duration: `${nights} nights`,
  };
}

const generatedBoats: Boat[] = Array.from({ length: 50 }, (_, index) => {
  const [location, country, latitude, longitude] =
    generatedDestinations[index % generatedDestinations.length];
  const name = `${generatedBoatNamePrefixes[index % generatedBoatNamePrefixes.length]} ${
    generatedBoatNameSuffixes[Math.floor(index / generatedBoatNamePrefixes.length)]
  }`;
  const type = generatedBoatTypes[index % generatedBoatTypes.length];
  const image = uniqueCoverForVesselId(`generated-boat-${index + 1}`);
  const owner = generatedOwners[index % generatedOwners.length];
  const dateDetails = generatedDateDetails(index);
  const hasEngine = type !== "Houseboat";

  return {
    id: `generated-sit-${index + 1}`,
    boatId: `generated-boat-${index + 1}`,
    name,
    type,
    length: feetToMetresString(30 + ((index * 3) % 35)),
    yearBuilt: 1990 + ((index * 7) % 35),
    location: `${location}, ${country}`,
    country,
    latitude,
    longitude,
    homePort: `${location}, ${country}`,
    ...dateDetails,
    image,
    gallery: [{ url: secondaryGalleryForVesselId(`generated-boat-${index + 1}`) }],
    owner,
    ownerLanguages: [...generatedOwnerLanguages[index % generatedOwnerLanguages.length]],
    ownerImage: `https://i.pravatar.cc/160?img=${(index % 60) + 1}`,
    rating: 4.5 + (index % 6) / 10,
    reviews: 3 + ((index * 7) % 38),
    applicants: 1 + ((index * 3) % 16),
    description: `${name} is a well-cared-for ${type.toLowerCase()} set up for comfortable stays aboard. The owners are looking for a dependable sitter to keep an eye on her while they are away.`,
    home: "A comfortable cabin, equipped galley, reliable shore power and easy access to marina facilities.",
    responsibilities: [
      "Check lines, fenders and bilges each day",
      "Monitor shore power and battery levels",
      "Air the cabins and inspect for leaks",
      "Send the owner a short weekly update",
    ],
    systems: hasEngine
      ? ["Diesel engine", "Shore power", "Battery monitor", "Fresh-water system"]
      : ["Shore power", "Battery monitor", "Holding tank", "Fresh-water connection"],
    engineType: hasEngine ? "Inboard diesel" : "No engine",
    voltageType: index % 4 === 0 ? "24 V DC" : "12 V DC",
    stoveFuelType: index % 3 === 0 ? "Electric / induction" : "LPG / propane",
    requirements: ["2+ years boating experience", "Basic systems knowledge", "Non-smoker"],
    minYearsExperience: 2,
    requiredExperience: ["Overnight stays aboard"],
    requiredCertifications: index % 4 === 0 ? ["VHF / SRC"] : [],
    requiredSkills: ["Line handling", "Basic maintenance"],
    amenities: [
      "Bathroom",
      "Full kitchen",
      "Wi-Fi",
      "Shore power",
      "On-site bathrooms & showers",
      "Gated access",
      ...(index % 2 === 0 ? ["On-site laundry", "Outdoor BBQ"] : ["TV", "Tender"]),
    ],
    pet: index % 8 === 0 ? "One friendly dog aboard" : undefined,
    featured: index % 10 === 0,
  };
});

boats.push(...generatedBoats);

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

function readLegacyBoats(): Boat[] {
  const stored = localStorage.getItem("harbourly-boats");
  if (!stored) return boats;
  try {
    return JSON.parse(stored) as Boat[];
  } catch {
    return boats;
  }
}

function formatHomePort(location: string, country: string) {
  const trimmedLocation = location.trim();
  const trimmedCountry = country.trim();
  if (!trimmedCountry || trimmedLocation.toLowerCase().includes(trimmedCountry.toLowerCase())) {
    return trimmedLocation;
  }
  return `${trimmedLocation}, ${trimmedCountry}`;
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

function sitLocation(location: string, country: string) {
  const suffix = `, ${country}`.toLowerCase();
  return location.toLowerCase().endsWith(suffix) ? location.slice(0, -suffix.length) : location;
}

function languagesForOwner(owner: string) {
  return boats.find((boat) => boat.owner === owner)?.ownerLanguages ?? ["English"];
}

const DEMO_SOLSTICE_PRIVATE_ACCESS: VesselPrivateAccess = {
  wifiNetwork: "Solstice-Guest",
  wifiPassword: "aegean-sun-42",
  accessCodes:
    "Marina pedestrian gate: 4821#\nLockbox on starboard winch: 3391\nCompanionway padlock: 2048",
  otherNotes: "Spare ignition key with marina office under Maya Ellison.",
};
const DEMO_SOLSTICE_FULL_ADDRESS = "Berth B12, Lefkas Marina, Lefkada 311 00, Greece";

const toVessel = (boat: Boat): Vessel => ({
  id: boat.boatId ?? boat.id,
  name: boat.name,
  type: boat.type,
  length: normalizeLengthToMetres(boat.length),
  yearBuilt: boat.yearBuilt ?? null,
  homePort: boat.homePort ?? formatHomePort(boat.location, boat.country),
  image: boat.image,
  gallery: normalizeGallery(boat.gallery),
  owner: boat.owner,
  ownerLanguages: boat.ownerLanguages ?? languagesForOwner(boat.owner),
  ownerImage: boat.ownerImage,
  rating: boat.rating,
  reviews: boat.reviews,
  description: boat.description,
  home: boat.home,
  systems: boat.systems,
  engineType: boat.engineType ?? "Not specified",
  voltageType: boat.voltageType ?? "Not specified",
  stoveFuelType: boat.stoveFuelType ?? "Not specified",
  amenities: boat.amenities,
  ...((boat.boatId ?? boat.id) === "solstice"
    ? { privateAccess: DEMO_SOLSTICE_PRIVATE_ACCESS }
    : {}),
});

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

const toSit = (boat: Boat): Sit => ({
  id: boat.id,
  boatId: boat.boatId ?? boat.id,
  dates: boat.dates,
  dateStart: boat.dateStart,
  duration: boat.duration,
  location: sitLocation(boat.location, boat.country),
  country: boat.country,
  latitude: boat.latitude,
  longitude: boat.longitude,
  fullAddress: boat.id === "solstice" ? DEMO_SOLSTICE_FULL_ADDRESS : undefined,
  sitType: boat.sitType ?? "liveaboard",
  responsibilities: boat.responsibilities,
  requirements: withoutNonSmokerRequirementLabels(boat.requirements),
  minYearsExperience: Number.parseInt(
    boat.requirements.find((requirement) => /\d+\+?\s+years?/i.test(requirement)) ?? "0",
    10,
  ),
  requiredExperience: [],
  requiredCertifications: [],
  requiredSkills: withoutNonSmokerRequirementLabels(boat.requirements).filter(
    (requirement) => !/\d+\+?\s+years?/i.test(requirement),
  ),
  maxGuests: boat.maxGuests ?? 2,
  applicants: boat.applicants,
  pet: boat.pet,
  featured: boat.featured,
  nonSmokerRequired: resolveNonSmokerRequired(boat),
  applicationsOpen: boat.applicationsOpen,
});

const GENERATED_VESSELS_SEED_KEY = "boatstead-generated-vessels-v5";
const GENERATED_SITS_SEED_KEY = "boatstead-generated-sits-v4";
const HANDCRAFTED_SIT_TYPE_SEED_KEY = "boatstead-handcrafted-sit-type-v1";

function mergeGeneratedVessels(current: Vessel[]) {
  if (localStorage.getItem(GENERATED_VESSELS_SEED_KEY)) return current;
  const generated = generatedBoats.map(toVessel);
  const generatedIds = new Set(generated.map((vessel) => vessel.id));
  const merged = [...current.filter((vessel) => !generatedIds.has(vessel.id)), ...generated];
  localStorage.setItem("harbourly-vessels", JSON.stringify(merged));
  localStorage.setItem(GENERATED_VESSELS_SEED_KEY, "complete");
  return merged;
}

const SOLSTICE_PRIVATE_ACCESS_SEED_KEY = "boatstead-solstice-private-access-v1";

function ensureSolsticePrivateAccess(current: Vessel[]) {
  if (localStorage.getItem(SOLSTICE_PRIVATE_ACCESS_SEED_KEY)) return current;
  localStorage.setItem(SOLSTICE_PRIVATE_ACCESS_SEED_KEY, "complete");
  let changed = false;
  const next = current.map((vessel) => {
    if (vessel.id !== "solstice" || hasVesselPrivateAccess(vessel.privateAccess)) return vessel;
    changed = true;
    return { ...vessel, privateAccess: DEMO_SOLSTICE_PRIVATE_ACCESS };
  });
  if (changed) {
    localStorage.setItem("harbourly-vessels", JSON.stringify(next));
  }
  return next;
}

const SOLSTICE_FULL_ADDRESS_SEED_KEY = "boatstead-solstice-full-address-v1";

function ensureSolsticeFullAddress(current: Sit[]) {
  if (localStorage.getItem(SOLSTICE_FULL_ADDRESS_SEED_KEY)) return current;
  localStorage.setItem(SOLSTICE_FULL_ADDRESS_SEED_KEY, "complete");
  let changed = false;
  const next = current.map((sit) => {
    if (sit.id !== "solstice" || sit.fullAddress?.trim()) return sit;
    changed = true;
    return { ...sit, fullAddress: DEMO_SOLSTICE_FULL_ADDRESS };
  });
  if (changed) {
    localStorage.setItem("harbourly-sits", JSON.stringify(next));
  }
  return next;
}

const HANDCRAFTED_SIT_TYPES: Record<string, SitType> = {
  solstice: "liveaboard",
  "sea-glass": "daytimeChecks",
};

function ensureHandcraftedSitTypes(current: Sit[]) {
  if (localStorage.getItem(HANDCRAFTED_SIT_TYPE_SEED_KEY)) return current;
  localStorage.setItem(HANDCRAFTED_SIT_TYPE_SEED_KEY, "complete");
  let changed = false;
  const next = current.map((sit) => {
    const sitType = HANDCRAFTED_SIT_TYPES[sit.id];
    if (!sitType || sit.sitType === sitType) return sit;
    changed = true;
    return { ...sit, sitType };
  });
  if (changed) {
    localStorage.setItem("harbourly-sits", JSON.stringify(next));
  }
  return next;
}

function mergeGeneratedSits(current: Sit[]) {
  if (localStorage.getItem(GENERATED_SITS_SEED_KEY)) return current;
  const generated = generatedBoats.map(toSit);
  const generatedIds = new Set(generated.map((sit) => sit.id));
  const merged = [...current.filter((sit) => !generatedIds.has(sit.id)), ...generated];
  localStorage.setItem("harbourly-sits", JSON.stringify(merged));
  localStorage.setItem(GENERATED_SITS_SEED_KEY, "complete");
  return merged;
}

function readVessels(): Vessel[] {
  const stored = localStorage.getItem("harbourly-vessels");
  if (stored) {
    try {
      const storedVessels = (
        JSON.parse(stored) as Array<
          Omit<
            Vessel,
            "engineType" | "voltageType" | "stoveFuelType" | "homePort" | "ownerLanguages"
          > & {
            engineType?: EngineType;
            voltageType?: VoltageType;
            stoveFuelType?: StoveFuelType;
            homePort?: string;
            ownerLanguages?: string[];
            location?: string;
            country?: string;
          }
        >
      ).map((storedVessel) => {
        const { country = "", location = "", ...vessel } = storedVessel;
        return withDemoGallery({
          ...vessel,
          length: normalizeLengthToMetres(vessel.length),
          yearBuilt: vessel.yearBuilt ?? null,
          image: ensureVesselCover(vessel),
          gallery: normalizeGallery(vessel.gallery).map((photo) => ({
            ...photo,
            url: ensureBoatImage(photo.url),
          })),
          ownerLanguages: vessel.ownerLanguages ?? languagesForOwner(vessel.owner),
          engineType: vessel.engineType ?? "Not specified",
          voltageType: vessel.voltageType ?? "Not specified",
          stoveFuelType: vessel.stoveFuelType ?? "Not specified",
          homePort: vessel.homePort ?? formatHomePort(location, country),
        });
      });
      return ensureSolsticePrivateAccess(mergeGeneratedVessels(storedVessels));
    } catch {
      // Fall through to the legacy seed.
    }
  }
  const unique = new Map(
    readLegacyBoats().map((boat) => [boat.boatId ?? boat.id, withDemoGallery(toVessel(boat))]),
  );
  return ensureSolsticePrivateAccess(mergeGeneratedVessels([...unique.values()]));
}

function readSits(): Sit[] {
  const stored = localStorage.getItem("harbourly-sits");
  if (stored) {
    try {
      const vessels = readVessels();
      const storedSits = (
        JSON.parse(stored) as Array<
          Omit<Sit, "location" | "country" | "latitude" | "longitude" | "maxGuests"> &
            Partial<Pick<Sit, "location" | "country" | "latitude" | "longitude" | "maxGuests">>
        >
      ).map((sit) => {
        const vessel = vessels.find((item) => item.id === sit.boatId);
        const fallback = splitHomePort(vessel?.homePort ?? "");
        const coordinates = coordinatesForLocation(
          sit.location ?? fallback.location,
          sit.country ?? fallback.country,
        );
        return {
          ...sit,
          requirements:
            sit.id === "solstice"
              ? sit.requirements.map((requirement) =>
                  requirement === "Diesel basics" ? "Diesel troubleshooting" : requirement,
                )
              : sit.requirements,
          requiredSkills:
            sit.id === "solstice"
              ? (sit.requiredSkills ?? []).map((skill) =>
                  skill === "Diesel basics" ? "Diesel troubleshooting" : skill,
                )
              : sit.requiredSkills,
          location: sit.location ?? fallback.location,
          country: sit.country ?? fallback.country,
          latitude: sit.latitude ?? coordinates.latitude,
          longitude: sit.longitude ?? coordinates.longitude,
          maxGuests: Math.max(1, Math.floor(sit.maxGuests ?? 2)),
        };
      });
      return ensureHandcraftedSitTypes(ensureSolsticeFullAddress(mergeGeneratedSits(storedSits)));
    } catch {
      // Fall through to the legacy seed.
    }
  }
  return ensureHandcraftedSitTypes(
    ensureSolsticeFullAddress(mergeGeneratedSits(readLegacyBoats().map(toSit))),
  );
}

function acceptedSitIds() {
  return new Set(
    readApplications()
      .filter((application) => application.status === "accepted")
      .map((application) => application.sitId),
  );
}

function publicVesselFields(vessel: Vessel): Omit<Vessel, "privateAccess"> {
  const { privateAccess: _privateAccess, ...publicVessel } = vessel;
  return publicVessel;
}

function joinSit(
  sit: Sit | undefined,
  vessels: Vessel[],
  acceptedIds: Set<string> = acceptedSitIds(),
): Boat | undefined {
  if (!sit) return undefined;
  const vessel = vessels.find((item) => item.id === sit.boatId);
  if (!vessel) return undefined;
  const accepted = acceptedIds.has(sit.id);
  const applicationsOpen = sit.applicationsOpen !== false;
  const nonSmokerRequired = resolveNonSmokerRequired(sit);
  const { fullAddress: _fullAddress, ...publicSit } = sit;
  return {
    ...publicVesselFields(vessel),
    ...publicSit,
    id: sit.id,
    boatId: vessel.id,
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

export function isAcceptingApplications(item: { applicationsOpen?: boolean }) {
  return item.applicationsOpen !== false;
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
  try {
    const remote = await apiGetBoats();
    // Real session: trust D1 even when empty. Otherwise prefer remote seed, else local demo.
    if ((await hasApiSession()) || remote.length) return remote.map(fromApiBoat);
  } catch {
    // Fall through to local demo data when the Worker/D1 path is unavailable.
  }
  await wait();
  const vessels = readVessels();
  const acceptedIds = acceptedSitIds();
  return readSits()
    .map((sit) => joinSit(sit, vessels, acceptedIds))
    .filter((listing): listing is Boat => Boolean(listing));
}

/** Saved listings for the signed-in shortlist; filter changes hit the server. */
export async function getSavedListings(options: {
  availability: "open" | "all";
  savedIds: string[];
}): Promise<Boat[]> {
  if (await hasApiSession()) {
    try {
      return (await apiGetSavedListings(options.availability)).map(fromApiBoat);
    } catch {
      // Fall through to local.
    }
  }
  await wait(180);
  if (options.savedIds.length === 0) return [];
  const vessels = readVessels();
  const acceptedIds = acceptedSitIds();
  const savedSet = new Set(options.savedIds);
  const listings = readSits()
    .map((sit) => joinSit(sit, vessels, acceptedIds))
    .filter((listing): listing is Boat => listing != null && savedSet.has(listing.id));
  const ordered = options.savedIds
    .map((id) => listings.find((boat) => boat.id === id))
    .filter((boat): boat is Boat => Boolean(boat));
  if (options.availability === "all") return ordered;
  return ordered.filter((boat) => !boat.accepted);
}

export async function getBoatsPage(params: BoatSearchParams): Promise<{
  boats: Boat[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    const remote = await apiGetBoatsPage(params);
    const hasFilters = Boolean(
      params.q ||
      (params.type && params.type !== "All vessels") ||
      (params.sitType && params.sitType !== "all") ||
      params.from ||
      params.to ||
      params.pet ||
      (params.availability && params.availability !== "all"),
    );
    // Trust the Worker when authenticated, when it has matches, or when filters
    // intentionally returned an empty page. Fall through only for an unseeded
    // empty catalogue with no session (local demo / e2e without D1 seed).
    if ((await hasApiSession()) || remote.total > 0 || hasFilters) {
      return {
        ...remote,
        boats: remote.boats.map(fromApiBoat),
      };
    }
  } catch {
    // Fall through to local demo data when the Worker/D1 path is unavailable.
  }

  await wait();
  const vessels = readVessels();
  const acceptedIds = acceptedSitIds();
  const all = readSits()
    .map((sit) => joinSit(sit, vessels, acceptedIds))
    .filter((listing): listing is Boat => Boolean(listing));
  const result = paginateBoats(all, params);
  return {
    boats: result.items,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}

export async function getBoat(id: string): Promise<Boat | undefined> {
  try {
    const remote = await apiGetBoat(id);
    if (remote) return fromApiBoat(remote);
    if (await hasApiSession()) return undefined;
  } catch {
    // Fall through.
  }
  await wait(220);
  return joinSit(
    readSits().find((sit) => sit.id === id),
    readVessels(),
  );
}

export async function getVessels(): Promise<Vessel[]> {
  if (await hasApiSession()) {
    try {
      return (await apiGetVessels()).map(fromApiVessel);
    } catch {
      // Fall through to local.
    }
  }
  await wait(250);
  return readVessels();
}

export async function getSits(): Promise<Sit[]> {
  if (await hasApiSession()) {
    try {
      const remote = (await apiGetSits()).map(fromApiSit);
      return remote.map((sit) => {
        const accepted = acceptedSitIds().has(sit.id);
        const applicationsOpen = sit.applicationsOpen !== false;
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
      });
    } catch {
      // Fall through.
    }
  }
  await wait(250);
  const acceptedIds = acceptedSitIds();
  return readSits().map((sit) => {
    const accepted = acceptedIds.has(sit.id);
    const applicationsOpen = sit.applicationsOpen !== false;
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
  });
}

export async function saveVessel(vessel: Vessel): Promise<Vessel> {
  const privateAccess = normalizeVesselPrivateAccess(vessel.privateAccess);
  const normalized: Vessel = {
    ...vessel,
    length: vessel.length ? normalizeLengthToMetres(vessel.length) : "",
    yearBuilt: vessel.yearBuilt ?? null,
    gallery: normalizeGallery(vessel.gallery),
    ...(privateAccess ? { privateAccess } : { privateAccess: undefined }),
  };
  if (!privateAccess) {
    delete normalized.privateAccess;
  }

  if (await hasApiSession()) {
    return fromApiVessel(await apiSaveVessel(normalized));
  }

  await wait(500);
  const current = readVessels();
  const exists = current.some((item) => item.id === normalized.id);
  const next = exists
    ? current.map((item) => (item.id === normalized.id ? normalized : item))
    : [normalized, ...current];
  localStorage.setItem("harbourly-vessels", JSON.stringify(next));
  return normalized;
}

function canViewerSeeVesselPrivateAccess(vessel: Vessel, sitId: string, viewerName: string) {
  if (vessel.owner === viewerName) return true;
  return readApplications().some(
    (application) =>
      application.sitId === sitId &&
      application.status === "accepted" &&
      application.applicant.name === viewerName,
  );
}

/** Private Wi-Fi / access codes / full address for a sit; only owner or the accepted sitter. */
export async function getSitPrivateAccessForViewer(
  sitId: string,
  viewerName: string,
): Promise<SitPrivateDetails | undefined> {
  if (await hasApiSession()) {
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

  await wait(180);
  const sit = readSits().find((item) => item.id === sitId);
  if (!sit) return undefined;
  const vessel = readVessels().find((item) => item.id === sit.boatId);
  if (!vessel) return undefined;
  if (!canViewerSeeVesselPrivateAccess(vessel, sitId, viewerName)) return undefined;
  const privateAccess = normalizeVesselPrivateAccess(vessel.privateAccess);
  const fullAddress = sit.fullAddress?.trim() || undefined;
  const details: SitPrivateDetails = {
    ...privateAccess,
    ...(fullAddress ? { fullAddress } : {}),
  };
  return hasSitPrivateDetails(details) ? details : undefined;
}

export async function deleteVessel(id: string): Promise<void> {
  if (await hasApiSession()) {
    await apiDeleteVessel(id);
    localStorage.setItem(
      "harbourly-vessels",
      JSON.stringify(readVessels().filter((vessel) => vessel.id !== id)),
    );
    return;
  }
  await wait(400);
  if (readSits().some((sit) => sit.boatId === id)) {
    throw new Error("VESSEL_HAS_SITS");
  }
  localStorage.setItem(
    "harbourly-vessels",
    JSON.stringify(readVessels().filter((vessel) => vessel.id !== id)),
  );
}

export async function updateOwnerOnVessels(
  previousName: string,
  owner: { name: string; image: string; languages: string[] },
): Promise<void> {
  await wait(250);
  localStorage.setItem(
    "harbourly-vessels",
    JSON.stringify(
      readVessels().map((vessel) =>
        vessel.owner === previousName
          ? {
              ...vessel,
              owner: owner.name,
              ownerImage: owner.image,
              ownerLanguages: owner.languages,
            }
          : vessel,
      ),
    ),
  );
  writeApplications(
    readApplications().map((application) => ({
      ...application,
      ownerName: application.ownerName === previousName ? owner.name : application.ownerName,
      ownerImage: application.ownerName === previousName ? owner.image : application.ownerImage,
      applicant:
        application.applicant.name === previousName
          ? {
              ...application.applicant,
              name: owner.name,
              image: owner.image,
              languages: owner.languages,
            }
          : application.applicant,
      messages: application.messages.map((message) =>
        message.senderName === previousName ? { ...message, senderName: owner.name } : message,
      ),
    })),
  );
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

  if (await hasApiSession()) {
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

  await wait(500);
  const current = readSits();
  const exists = current.some((item) => item.id === normalized.id);
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
  const next = exists
    ? current.map((item) => (item.id === normalized.id ? normalized : item))
    : [normalized, ...current];
  localStorage.setItem("harbourly-sits", JSON.stringify(next));
  return normalized;
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
  await wait(200);
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
  await wait(200);
  const vessels = readVessels().filter((vessel) => vessel.owner === owner.name);
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
  // Write directly so DEV seeding is not blocked by identity verification gates.
  const current = readSits();
  localStorage.setItem("harbourly-sits", JSON.stringify([sit, ...current]));
  return sit;
}

export async function deleteSit(id: string): Promise<void> {
  if (await hasApiSession()) {
    const sits = await apiGetSits();
    const sit = sits.find((item) => item.id === id);
    if (!sit) return;
    const accepted = acceptedSitIds().has(id);
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
    return;
  }

  await wait(400);
  const sit = readSits().find((item) => item.id === id);
  if (!sit) return;

  const accepted = acceptedSitIds().has(id);
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

  localStorage.setItem(
    "harbourly-sits",
    JSON.stringify(readSits().filter((item) => item.id !== id)),
  );
  writeApplications(readApplications().filter((application) => application.sitId !== id));
}

export type ApplicationStatus = "new" | "shortlisted" | "accepted" | "declined" | "withdrawn";
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
    | "newApplication"
    | "newMessage"
    | "sitAccepted"
    | "sitReminder"
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
    | "applicantsClosed"
    | "videoCallRequest"
    | "videoCallCounter"
    | "videoCallAccepted"
    | "videoCallDeclined"
    | "phoneShared"
    | "withdrawn";
  videoCall?: {
    startsAt: string;
    durationMinutes: number;
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
  createdAt: string;
  messages: ApplicationMessage[];
  ownerPhone?: string;
};

const seededApplications: SitApplication[] = [
  {
    id: "application-alex-solstice",
    sitId: "solstice",
    boatName: "Solstice",
    ownerName: "Maya & Finn",
    ownerImage: "https://i.pravatar.cc/160?img=47",
    applicant: {
      name: "Alex Morgan",
      image: "https://i.pravatar.cc/160?img=11",
      location: "Brighton, United Kingdom",
      bio: "Calm liveaboard sailor with practical diesel and electrical experience.",
      languages: ["English", "French"],
      preferredCountries: ["Greece", "Croatia", "Italy"],
      skills: ["Diesel troubleshooting", "12V electrical", "Mooring & lines", "Pet care"],
      yearsExperience: 7,
      completedSits: 8,
      certifications: ["RYA Day Skipper", "VHF / SRC", "First aid"],
      memberSince: 2021,
    },
    partySize: 2,
    initialMessage:
      "Hi Maya and Finn, I would love to care for Solstice. I have seven years of liveaboard sailing experience and can confidently handle routine diesel, battery, bilge and line checks.",
    status: "accepted",
    createdAt: "2026-07-18T09:30:00.000Z",
    messages: [
      {
        id: "message-alex-initial",
        senderName: "Alex Morgan",
        text: "Hi Maya and Finn, I would love to care for Solstice. I have seven years of liveaboard sailing experience and can confidently handle routine diesel, battery, bilge and line checks.",
        createdAt: "2026-07-18T09:30:00.000Z",
      },
      {
        id: "message-maya-reply",
        senderName: "Maya & Finn",
        text: "Thanks Alex. Your systems experience looks like a strong fit. Are you available for a video handover next week?",
        createdAt: "2026-07-18T13:15:00.000Z",
      },
      {
        id: "message-maya-accept",
        senderName: "Maya & Finn",
        text: "We would love to have you aboard Solstice. Looking forward to the handover.",
        createdAt: "2026-07-19T10:00:00.000Z",
      },
      {
        id: "message-system-accepted-alex-solstice",
        senderName: "Boatstead",
        text: "You were accepted for this sit",
        createdAt: "2026-07-19T10:00:01.000Z",
        kind: "system",
        systemKind: "accepted",
      },
    ],
  },
  {
    id: "application-samira-solstice",
    sitId: "solstice",
    boatName: "Solstice",
    ownerName: "Maya & Finn",
    ownerImage: "https://i.pravatar.cc/160?img=47",
    applicant: {
      name: "Samira Costa",
      image: "https://i.pravatar.cc/160?img=45",
      location: "Lisbon, Portugal",
      bio: "Offshore crew member and experienced pet sitter who works remotely.",
      languages: ["Portuguese", "English", "Spanish"],
      preferredCountries: ["Portugal", "Spain", "Greece"],
      skills: ["Mooring & lines", "Storm preparation", "Pet care", "Tender handling"],
      yearsExperience: 4,
      completedSits: 5,
      certifications: ["ICC", "VHF / SRC", "First aid"],
      memberSince: 2022,
    },
    partySize: 1,
    initialMessage:
      "Hello, Solstice looks wonderful. I have completed several Mediterranean passages and have cared for boats and pets in Portugal, Spain and Greece.",
    status: "declined",
    createdAt: "2026-07-19T16:45:00.000Z",
    messages: [
      {
        id: "message-samira-initial",
        senderName: "Samira Costa",
        text: "Hello, Solstice looks wonderful. I have completed several Mediterranean passages and have cared for boats and pets in Portugal, Spain and Greece.",
        createdAt: "2026-07-19T16:45:00.000Z",
      },
    ],
  },
  {
    id: "application-theo-solstice",
    sitId: "solstice",
    boatName: "Solstice",
    ownerName: "Maya & Finn",
    ownerImage: "https://i.pravatar.cc/160?img=47",
    applicant: {
      name: "Theo Janssen",
      image: "https://i.pravatar.cc/160?img=15",
      location: "Rotterdam, Netherlands",
      bio: "Mechanical engineer building experience toward longer cruising trips.",
      languages: ["Dutch", "English", "German"],
      preferredCountries: ["Netherlands", "Germany", "Denmark"],
      skills: ["Diesel troubleshooting", "12V electrical", "Solar / lithium"],
      yearsExperience: 2,
      completedSits: 1,
      certifications: ["VHF / SRC"],
      memberSince: 2024,
    },
    partySize: 1,
    initialMessage:
      "Hi, I am a mechanical engineer with two seasons of coastal sailing. I am very comfortable with engines and electrical systems and would be happy to follow a detailed care plan.",
    status: "declined",
    createdAt: "2026-07-20T11:20:00.000Z",
    messages: [
      {
        id: "message-theo-initial",
        senderName: "Theo Janssen",
        text: "Hi, I am a mechanical engineer with two seasons of coastal sailing. I am very comfortable with engines and electrical systems and would be happy to follow a detailed care plan.",
        createdAt: "2026-07-20T11:20:00.000Z",
      },
    ],
  },
  {
    id: "application-accepted-blue-hour",
    sitId: "blue-hour",
    boatName: "Blue Hour",
    ownerName: "Jonas",
    ownerImage: "https://i.pravatar.cc/160?img=12",
    applicant: {
      name: "Alex Morgan",
      image: "https://i.pravatar.cc/160?img=11",
      location: "Brighton, United Kingdom",
      bio: "Calm liveaboard sailor with practical diesel and electrical experience.",
      languages: ["English", "French"],
      preferredCountries: ["Greece", "Croatia", "Italy"],
      skills: ["Diesel troubleshooting", "12V electrical", "Mooring & lines", "Pet care"],
      yearsExperience: 7,
      completedSits: 8,
      certifications: ["RYA Day Skipper", "VHF / SRC", "First aid"],
      memberSince: 2021,
    },
    partySize: 2,
    initialMessage: "Hi Jonas, I would be glad to look after Blue Hour during your trip away.",
    status: "accepted",
    createdAt: "2026-07-15T09:00:00.000Z",
    messages: [
      {
        id: "message-blue-hour-initial",
        senderName: "Alex Morgan",
        text: "Hi Jonas, I would be glad to look after Blue Hour during your trip away.",
        createdAt: "2026-07-15T09:00:00.000Z",
      },
    ],
  },
  {
    id: "application-accepted-mistral",
    sitId: "mistral",
    boatName: "Mistral",
    ownerName: "Elena",
    ownerImage: "https://i.pravatar.cc/160?img=32",
    applicant: {
      name: "Samira Costa",
      image: "https://i.pravatar.cc/160?img=45",
      location: "Lisbon, Portugal",
      bio: "Offshore crew member and experienced pet sitter who works remotely.",
      languages: ["Portuguese", "English", "Spanish"],
      preferredCountries: ["Portugal", "Spain", "Greece"],
      skills: ["Mooring & lines", "Storm preparation", "Pet care", "Tender handling"],
      yearsExperience: 4,
      completedSits: 5,
      certifications: ["ICC", "VHF / SRC", "First aid"],
      memberSince: 2022,
    },
    partySize: 1,
    initialMessage: "Hello Elena, Mistral looks like a great winter sit and I am available.",
    status: "accepted",
    createdAt: "2026-07-12T12:00:00.000Z",
    messages: [
      {
        id: "message-mistral-initial",
        senderName: "Samira Costa",
        text: "Hello Elena, Mistral looks like a great winter sit and I am available.",
        createdAt: "2026-07-12T12:00:00.000Z",
      },
    ],
  },
  ...Array.from({ length: 6 }, (_, index) => {
    const sitNumber = index * 5 + 2;
    return {
      id: `application-accepted-generated-${sitNumber}`,
      sitId: `generated-sit-${sitNumber}`,
      boatName: `Generated ${sitNumber}`,
      ownerName: "Generated Owner",
      ownerImage: "https://i.pravatar.cc/160?img=5",
      applicant: {
        name: "Alex Morgan",
        image: "https://i.pravatar.cc/160?img=11",
        location: "Brighton, United Kingdom",
        bio: "Calm liveaboard sailor with practical diesel and electrical experience.",
        languages: ["English", "French"],
        preferredCountries: ["Greece", "Croatia", "Italy"],
        skills: ["Diesel troubleshooting", "12V electrical", "Mooring & lines"],
        yearsExperience: 7,
        completedSits: 8,
        certifications: ["RYA Day Skipper", "VHF / SRC"],
        memberSince: 2021,
      },
      partySize: 1,
      initialMessage: "Happy to take this sit if the dates still work.",
      status: "accepted" as const,
      createdAt: "2026-07-10T08:00:00.000Z",
      messages: [
        {
          id: `message-accepted-generated-${sitNumber}`,
          senderName: "Alex Morgan",
          text: "Happy to take this sit if the dates still work.",
          createdAt: "2026-07-10T08:00:00.000Z",
        },
      ],
    };
  }),
];

function fallbackMemberSince(name: string) {
  return (
    {
      "Alex Morgan": 2021,
      "Samira Costa": 2022,
      "Theo Janssen": 2024,
    }[name] ?? 2024
  );
}

function fallbackCompletedSits(name: string) {
  return (
    {
      "Alex Morgan": 8,
      "Samira Costa": 5,
      "Theo Janssen": 1,
    }[name] ?? 0
  );
}

const APPLICATIONS_SEED_KEY = "boatstead-applications-v3";

function ensureAcceptedSystemMessage(application: SitApplication): SitApplication {
  if (application.status !== "accepted") return application;
  const hasAcceptedSystemMessage = application.messages.some(
    (message) => message.kind === "system" && message.systemKind === "accepted",
  );
  if (hasAcceptedSystemMessage) return application;
  return {
    ...application,
    messages: [
      ...application.messages,
      {
        id: `message-system-accepted-${application.id}`,
        senderName: "Boatstead",
        text: "You were accepted for this sit",
        createdAt: new Date().toISOString(),
        kind: "system",
        systemKind: "accepted",
      },
    ],
  };
}

function appendSystemMessage(
  application: SitApplication,
  systemKind: NonNullable<ApplicationMessage["systemKind"]>,
  text: string,
): SitApplication {
  if (
    application.messages.some(
      (message) => message.kind === "system" && message.systemKind === systemKind,
    )
  ) {
    return application;
  }
  return {
    ...application,
    messages: [
      ...application.messages,
      {
        id: `message-system-${systemKind}-${application.id}-${Date.now().toString(36)}`,
        senderName: "Boatstead",
        text,
        createdAt: new Date().toISOString(),
        kind: "system",
        systemKind,
      },
    ],
  };
}

function ensureDeclinedSystemMessage(application: SitApplication): SitApplication {
  if (application.status !== "declined") return application;
  return appendSystemMessage(
    application,
    "declined",
    "You are no longer being considered for this sit",
  );
}

function ensureApplicantsClosedSystemMessage(application: SitApplication): SitApplication {
  return appendSystemMessage(
    application,
    "applicantsClosed",
    "The owner is no longer considering applicants for this sit",
  );
}

function readApplications(): SitApplication[] {
  if (!localStorage.getItem(APPLICATIONS_SEED_KEY)) {
    localStorage.removeItem("harbourly-applications");
    localStorage.removeItem("boatstead-applications-v2");
    localStorage.setItem(APPLICATIONS_SEED_KEY, "complete");
  }
  try {
    const stored = JSON.parse(
      localStorage.getItem("harbourly-applications") ?? "[]",
    ) as SitApplication[];
    const storedIds = new Set(stored.map((application) => application.id));
    return [
      ...stored
        .filter((application) => application.id && application.applicant)
        .map((application) =>
          ensureDeclinedSystemMessage(
            ensureAcceptedSystemMessage({
              ...application,
              partySize: Math.max(1, Math.floor(application.partySize ?? 1)),
              applicant: {
                ...application.applicant,
                memberSince:
                  application.applicant.memberSince ??
                  fallbackMemberSince(application.applicant.name),
                completedSits:
                  application.applicant.completedSits ??
                  fallbackCompletedSits(application.applicant.name),
              },
            }),
          ),
        ),
      ...seededApplications
        .filter((application) => !storedIds.has(application.id))
        .map((application) =>
          ensureDeclinedSystemMessage(ensureAcceptedSystemMessage(application)),
        ),
    ];
  } catch {
    return seededApplications.map((application) =>
      ensureDeclinedSystemMessage(ensureAcceptedSystemMessage(application)),
    );
  }
}

function writeApplications(applications: SitApplication[]) {
  localStorage.setItem("harbourly-applications", JSON.stringify(applications));
}

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
    completedSits: applicant.completedSits ?? fallbackCompletedSits(applicant.name),
  };

  if (await hasApiSession()) {
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

  await wait(700);
  const applications = readApplications();
  const existing = applications.find(
    (application) => application.sitId === sitId && application.applicant.name === applicant.name,
  );
  if (existing && existing.status !== "withdrawn") return existing;
  const sit = readSits().find((item) => item.id === sitId);
  if (!sit) throw new Error("APPLICATION_SIT_NOT_FOUND");
  if (!isAcceptingApplications(sit)) {
    throw new Error("APPLICATIONS_CLOSED");
  }
  const confirmedConflict = findConfirmedSitDateConflict(
    applications,
    readSits(),
    applicant.name,
    sit,
  );
  if (confirmedConflict) {
    throw new Error("APPLICATION_CONFIRMED_SIT_CONFLICT");
  }
  const normalizedPartySize = Math.floor(partySize);
  if (normalizedPartySize < 1 || normalizedPartySize > sit.maxGuests) {
    throw new Error("APPLICATION_PARTY_SIZE_INVALID");
  }
  const listing = joinSit(sit, readVessels());
  if (!listing) throw new Error("APPLICATION_SIT_NOT_FOUND");
  const createdAt = new Date().toISOString();
  if (existing?.status === "withdrawn") {
    const reopened = {
      ...existing,
      partySize: normalizedPartySize,
      initialMessage: message.trim(),
      status: "new" as const,
      createdAt,
      ownerPhone: undefined,
      messages: [
        {
          id: `message-${Date.now()}`,
          senderName: applicant.name,
          text: message.trim(),
          createdAt,
          kind: "user" as const,
        },
      ],
    };
    writeApplications(applications.map((item) => (item.id === existing.id ? reopened : item)));
    localStorage.setItem(
      "harbourly-sits",
      JSON.stringify(
        readSits().map((item) =>
          item.id === sitId ? { ...item, applicants: item.applicants + 1 } : item,
        ),
      ),
    );
    return reopened;
  }
  const application: SitApplication = {
    id: `application-${sitId}-${Date.now()}`,
    sitId,
    boatName: listing.name,
    ownerName: listing.owner,
    ownerImage: listing.ownerImage,
    partySize: normalizedPartySize,
    applicant: applicantProfile,
    initialMessage: message.trim(),
    status: "new",
    createdAt,
    messages: [
      {
        id: `message-${Date.now()}`,
        senderName: applicant.name,
        text: message.trim(),
        createdAt,
      },
    ],
  };
  writeApplications([application, ...applications]);
  const sits = readSits();
  localStorage.setItem(
    "harbourly-sits",
    JSON.stringify(
      sits.map((item) => (item.id === sitId ? { ...item, applicants: item.applicants + 1 } : item)),
    ),
  );
  return application;
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
  if (await hasApiSession()) {
    try {
      const result = await apiGetApplicationsForSit(sitId, params);
      return {
        ...result,
        applications: result.applications.map(fromApiApplication),
        accepted: result.accepted.map(fromApiApplication),
      };
    } catch {
      // Fall through.
    }
  }
  await wait(250);
  const sit = readSits().find((item) => item.id === sitId);
  const rows = readApplications().filter((application) => application.sitId === sitId);
  const { list, accepted } = prepareApplicationReviewLists(rows, {
    status: parseApplicationStatusFilter(params?.status),
    experience: parseApplicationExperienceFilter(params?.experience),
    sort: parseApplicationListSort(params?.sort),
    sit: sit
      ? {
          minYearsExperience: sit.minYearsExperience,
          requiredSkills: sit.requiredSkills,
          requiredCertifications: sit.requiredCertifications,
        }
      : undefined,
  });
  const paged = paginateApplicationList(
    list,
    params?.page,
    params?.limit ?? APPLICATIONS_PAGE_SIZE,
  );
  return {
    applications: paged.items,
    accepted,
    total: paged.total,
    page: paged.page,
    limit: paged.limit,
    totalPages: paged.totalPages,
    sitTotal: rows.length,
  };
}

export async function getApplicationsForUser(userName: string): Promise<SitApplication[]> {
  if (await hasApiSession()) {
    try {
      return (await apiGetApplicationsForUser(userName)).map(fromApiApplication);
    } catch {
      // Fall through.
    }
  }
  await wait(250);
  return readApplications()
    .filter(
      (application) =>
        application.ownerName === userName || application.applicant.name === userName,
    )
    .sort((a, b) => {
      const aTime = a.messages.at(-1)?.createdAt ?? a.createdAt;
      const bTime = b.messages.at(-1)?.createdAt ?? b.createdAt;
      return bTime.localeCompare(aTime);
    });
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  ownerPhone?: string,
): Promise<SitApplication> {
  if (await hasApiSession()) {
    if (status === "withdrawn") {
      throw new Error("WITHDRAW_NOT_ALLOWED");
    }
    try {
      return fromApiApplication(
        await apiUpdateApplicationStatus(applicationId, status, ownerPhone),
      );
    } catch (error) {
      if (error instanceof ApiError && error.message === "APPLICATION_NOT_FOUND") {
        throw new Error("APPLICATION_NOT_FOUND");
      }
      throw error;
    }
  }

  await wait(350);
  const applications = readApplications();
  const application = applications.find((item) => item.id === applicationId);
  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  const wasAccepted = application.status === "accepted";
  let updated = ensureAcceptedSystemMessage({
    ...application,
    status,
    ownerPhone: status === "accepted" ? ownerPhone : undefined,
  });
  if (status === "declined") {
    updated = ensureDeclinedSystemMessage(updated);
  }
  let nextApplications = applications.map((item) => (item.id === applicationId ? updated : item));
  if (status === "accepted") {
    nextApplications = nextApplications.map((item) => {
      if (item.id === applicationId || item.sitId !== application.sitId) return item;
      if (item.status !== "new" && item.status !== "shortlisted") return item;
      return ensureApplicantsClosedSystemMessage(item);
    });
  }
  writeApplications(nextApplications);
  const sits = readSits();
  const sit = sits.find((item) => item.id === application.sitId);
  if (sit) {
    if (status === "accepted" && sit.applicationsOpen !== false) {
      localStorage.setItem(
        "harbourly-sits",
        JSON.stringify(
          sits.map((item) => (item.id === sit.id ? { ...item, applicationsOpen: false } : item)),
        ),
      );
    } else if (wasAccepted && status !== "accepted") {
      localStorage.setItem(
        "harbourly-sits",
        JSON.stringify(
          sits.map((item) => (item.id === sit.id ? { ...item, applicationsOpen: true } : item)),
        ),
      );
    }
  }
  return updated;
}

export async function withdrawApplication(
  applicationId: string,
  applicantName: string,
  explanation?: string,
): Promise<SitApplication> {
  if (await hasApiSession()) {
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

  await wait(350);
  const applications = readApplications();
  const application = applications.find((item) => item.id === applicationId);
  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  if (application.applicant.name !== applicantName) {
    throw new Error("WITHDRAW_NOT_ALLOWED");
  }
  if (application.status === "withdrawn" || application.status === "declined") {
    throw new Error("WITHDRAW_NOT_ALLOWED");
  }
  const wasAccepted = application.status === "accepted";
  const note = explanation?.trim() ?? "";
  const updated = {
    ...application,
    status: "withdrawn" as const,
    ownerPhone: undefined,
    messages: [
      ...application.messages,
      {
        id: `message-withdraw-${Date.now()}`,
        senderName: applicantName,
        text: note,
        createdAt: new Date().toISOString(),
        kind: "system" as const,
        systemKind: "withdrawn" as const,
      },
    ],
  };
  writeApplications(applications.map((item) => (item.id === applicationId ? updated : item)));
  const sits = readSits();
  const sit = sits.find((item) => item.id === application.sitId);
  if (sit) {
    localStorage.setItem(
      "harbourly-sits",
      JSON.stringify(
        sits.map((item) =>
          item.id === sit.id
            ? {
                ...item,
                applicants: Math.max(0, item.applicants - 1),
                ...(wasAccepted ? { applicationsOpen: true } : {}),
              }
            : item,
        ),
      ),
    );
  }
  return updated;
}

export async function getNotificationsForUser(userName: string): Promise<MockNotification[]> {
  if (await hasApiSession()) {
    try {
      const remote = await apiGetNotifications();
      return remote.map((item) => ({
        id: item.id,
        type: item.type as MockNotification["type"],
        actor: item.actor,
        boatName: item.boatName,
        href: item.href,
        createdAt: item.createdAt,
        read: Boolean(item.read),
      }));
    } catch {
      // Fall through to demo notifications.
    }
  }

  await wait(250);
  try {
    const extraDelay = Number(localStorage.getItem("boatstead-e2e-notification-delay-ms") || 0);
    if (Number.isFinite(extraDelay) && extraDelay > 0) await wait(extraDelay);
  } catch {
    // ignore storage access errors
  }
  const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1_000).toISOString();
  let seenIds: string[] = [];
  try {
    seenIds = JSON.parse(localStorage.getItem(`boatstead-seen-notifications:${userName}`) ?? "[]");
  } catch {
    seenIds = [];
  }
  const withRead = (items: MockNotification[]) =>
    items.map((item) => ({ ...item, read: seenIds.includes(item.id) }));

  if (userName === "Maya & Finn") {
    return withRead([
      {
        actor: "Theo Janssen",
        boatName: "Solstice",
        createdAt: minutesAgo(18),
        href: "/owner/sits/solstice/applications",
        id: "maya-sit-accepted",
        type: "sitAccepted",
      },
      {
        actor: "Samira Costa",
        boatName: "Solstice",
        createdAt: minutesAgo(74),
        href: "/owner/sits/solstice/applications",
        id: "maya-new-application",
        type: "newApplication",
      },
      {
        actor: "Alex Morgan",
        boatName: "Solstice",
        createdAt: minutesAgo(190),
        href: "/messages",
        id: "maya-new-message",
        type: "newMessage",
      },
    ]);
  }

  if (userName === "Alex Morgan") {
    return withRead([
      {
        actor: "Maya & Finn",
        boatName: "Solstice",
        createdAt: minutesAgo(9),
        href: "/messages",
        id: "alex-application-accepted",
        type: "applicationAccepted",
      },
      {
        actor: "Maya & Finn",
        boatName: "Solstice",
        createdAt: minutesAgo(42),
        href: "/messages",
        id: "alex-new-message",
        type: "newMessage",
      },
      {
        boatName: "Solstice",
        createdAt: minutesAgo(1_440),
        href: "/boats/solstice",
        id: "alex-sit-reminder",
        type: "sitReminder",
      },
    ]);
  }

  return withRead([
    {
      createdAt: minutesAgo(5),
      href: "/members/me?edit=1",
      id: `welcome-${userName}`,
      type: "welcome",
    },
  ]);
}

export async function markNotificationRead(
  notificationId: string,
  userName: string,
): Promise<MockNotification | undefined> {
  if (await hasApiSession()) {
    try {
      const item = await apiMarkNotificationRead(notificationId);
      return {
        id: item.id,
        type: item.type as MockNotification["type"],
        actor: item.actor,
        boatName: item.boatName,
        href: item.href,
        createdAt: item.createdAt,
        read: Boolean(item.read),
      };
    } catch {
      // Fall through to local seen tracking.
    }
  }

  const key = `boatstead-seen-notifications:${userName}`;
  let seenIds: string[] = [];
  try {
    seenIds = JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    seenIds = [];
  }
  if (!seenIds.includes(notificationId)) {
    seenIds = [...seenIds, notificationId];
    localStorage.setItem(key, JSON.stringify(seenIds));
  }
  const items = await getNotificationsForUser(userName);
  return items.find((item) => item.id === notificationId);
}

export async function markAllNotificationsRead(userName: string): Promise<MockNotification[]> {
  if (await hasApiSession()) {
    try {
      const remote = await apiMarkAllNotificationsRead();
      return remote.map((item) => ({
        id: item.id,
        type: item.type as MockNotification["type"],
        actor: item.actor,
        boatName: item.boatName,
        href: item.href,
        createdAt: item.createdAt,
        read: Boolean(item.read),
      }));
    } catch {
      // Fall through to local seen tracking.
    }
  }

  const items = await getNotificationsForUser(userName);
  const key = `boatstead-seen-notifications:${userName}`;
  const seenIds = [...new Set([...items.map((item) => item.id)])];
  localStorage.setItem(key, JSON.stringify(seenIds));
  return items.map((item) => ({ ...item, read: true }));
}

export async function sendApplicationMessage(
  applicationId: string,
  senderName: string,
  text: string,
): Promise<SitApplication> {
  if (await hasApiSession()) {
    try {
      return fromApiApplication(await apiSendApplicationMessage(applicationId, text.trim()));
    } catch (error) {
      if (error instanceof ApiError && error.message === "APPLICATION_NOT_FOUND") {
        throw new Error("APPLICATION_NOT_FOUND");
      }
      throw error;
    }
  }

  await wait(350);
  const applications = readApplications();
  const application = applications.find((item) => item.id === applicationId);
  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  const updated = {
    ...application,
    messages: [
      ...application.messages,
      {
        id: `message-${Date.now()}`,
        senderName,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      },
    ],
  };
  writeApplications(applications.map((item) => (item.id === applicationId ? updated : item)));
  return updated;
}

export async function shareApplicationPhoneNumber(
  applicationId: string,
  senderName: string,
  phoneNumber: string,
): Promise<SitApplication> {
  if (await hasApiSession()) {
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

  await wait(350);
  const applications = readApplications();
  const application = applications.find((item) => item.id === applicationId);
  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  const sharedPhone = phoneNumber.trim();
  if (!sharedPhone) throw new Error("PHONE_NUMBER_REQUIRED");
  const updated = {
    ...application,
    messages: [
      ...application.messages,
      {
        id: `message-phone-${Date.now()}`,
        senderName,
        text: `${senderName} shared their phone number`,
        createdAt: new Date().toISOString(),
        kind: "system" as const,
        systemKind: "phoneShared" as const,
        sharedPhone,
      },
    ],
  };
  writeApplications(applications.map((item) => (item.id === applicationId ? updated : item)));
  return updated;
}

export async function requestApplicationVideoCall(
  applicationId: string,
  senderName: string,
  proposal: { startsAt: string; durationMinutes: number },
  options?: { counter?: boolean },
): Promise<SitApplication> {
  if (await hasApiSession()) {
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

  await wait(350);
  const applications = readApplications();
  const application = applications.find((item) => item.id === applicationId);
  if (!application) throw new Error("APPLICATION_NOT_FOUND");

  const startsAt = new Date(proposal.startsAt);
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
    throw new Error("VIDEO_CALL_TIME_PAST");
  }
  const durationMinutes = Math.max(5, Math.round(proposal.durationMinutes));
  const isCounter = Boolean(options?.counter);
  const systemKind = isCounter ? ("videoCallCounter" as const) : ("videoCallRequest" as const);
  const updated = {
    ...application,
    messages: [
      ...application.messages,
      {
        id: `message-video-call-${Date.now()}`,
        senderName,
        text: isCounter
          ? `${senderName} suggested a different video call time`
          : `${senderName} proposed a video call`,
        createdAt: new Date().toISOString(),
        kind: "system" as const,
        systemKind,
        videoCall: {
          startsAt: startsAt.toISOString(),
          durationMinutes,
        },
      },
    ],
  };
  writeApplications(applications.map((item) => (item.id === applicationId ? updated : item)));
  return updated;
}

export async function acceptApplicationVideoCall(
  applicationId: string,
  senderName: string,
  messageId: string,
): Promise<SitApplication> {
  if (await hasApiSession()) {
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

  await wait(320);
  const applications = readApplications();
  const application = applications.find((item) => item.id === applicationId);
  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  const proposal = application.messages.find((message) => message.id === messageId);
  if (
    !proposal?.videoCall ||
    (proposal.systemKind !== "videoCallRequest" && proposal.systemKind !== "videoCallCounter")
  ) {
    throw new Error("VIDEO_CALL_PROPOSAL_NOT_FOUND");
  }
  if (proposal.senderName === senderName) {
    throw new Error("VIDEO_CALL_CANNOT_ACCEPT_OWN");
  }

  const updated = {
    ...application,
    messages: [
      ...application.messages,
      {
        id: `message-video-call-accepted-${Date.now()}`,
        senderName,
        text: `${senderName} accepted the video call time`,
        createdAt: new Date().toISOString(),
        kind: "system" as const,
        systemKind: "videoCallAccepted" as const,
        videoCall: { ...proposal.videoCall },
      },
    ],
  };
  writeApplications(applications.map((item) => (item.id === applicationId ? updated : item)));
  return updated;
}

export async function declineApplicationVideoCall(
  applicationId: string,
  senderName: string,
  messageId: string,
): Promise<SitApplication> {
  if (await hasApiSession()) {
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

  await wait(320);
  const applications = readApplications();
  const application = applications.find((item) => item.id === applicationId);
  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  const proposal = application.messages.find((message) => message.id === messageId);
  if (
    !proposal?.videoCall ||
    (proposal.systemKind !== "videoCallRequest" && proposal.systemKind !== "videoCallCounter")
  ) {
    throw new Error("VIDEO_CALL_PROPOSAL_NOT_FOUND");
  }
  if (proposal.senderName === senderName) {
    throw new Error("VIDEO_CALL_CANNOT_DECLINE_OWN");
  }

  const updated = {
    ...application,
    messages: [
      ...application.messages,
      {
        id: `message-video-call-declined-${Date.now()}`,
        senderName,
        text: `${senderName} declined the video call proposal`,
        createdAt: new Date().toISOString(),
        kind: "system" as const,
        systemKind: "videoCallDeclined" as const,
        videoCall: { ...proposal.videoCall },
      },
    ],
  };
  writeApplications(applications.map((item) => (item.id === applicationId ? updated : item)));
  return updated;
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
  try {
    return await apiSubmitSupportRequest(request);
  } catch {
    // Fall through to local persistence when the Worker is unavailable.
  }
  await wait(650);
  const submission = { ...request, createdAt: new Date().toISOString() };
  const existing = JSON.parse(localStorage.getItem("harbourly-support-requests") ?? "[]");
  localStorage.setItem("harbourly-support-requests", JSON.stringify([...existing, submission]));
  return submission;
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
  sitterName: string;
  ownerName: string;
  ownerImage: string;
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

const REVIEWS_SEED_KEY = "boatstead-reviews-v1";

const seededReviews: SitReview[] = [
  {
    id: "review-juniper-alex",
    sitId: "juniper-historic",
    boatName: "Juniper",
    applicationId: "application-alex-juniper",
    sitterName: "Alex Morgan",
    ownerName: "Sarah & Tom",
    ownerImage: "https://i.pravatar.cc/100?img=14",
    rating: 5,
    text: "Alex was exactly who you want looking after a boat: methodical, communicative and calm when a windy front came through. The handover back was immaculate.",
    createdAt: "2026-06-12T10:00:00.000Z",
    location: "Preveza, Greece",
    response: {
      text: "Thank you Sarah and Tom. Juniper was a joy to care for and I appreciated the clear handover notes.",
      createdAt: "2026-06-13T09:20:00.000Z",
    },
  },
  {
    id: "review-kindred-alex",
    sitId: "kindred-historic",
    boatName: "Kindred",
    applicationId: "application-alex-kindred",
    sitterName: "Alex Morgan",
    ownerName: "Marcus",
    ownerImage: "https://i.pravatar.cc/100?img=53",
    rating: 5,
    text: "A genuinely capable sitter. Alex spotted a small freshwater pump leak early, sent clear photos and coordinated the fix with our engineer. Highly recommended.",
    createdAt: "2026-02-20T14:30:00.000Z",
    location: "Lisbon, Portugal",
  },
  {
    id: "review-tern-alex",
    sitId: "tern-historic",
    boatName: "Tern",
    applicationId: "application-alex-tern",
    sitterName: "Alex Morgan",
    ownerName: "Jo & Ellie",
    ownerImage: "https://i.pravatar.cc/100?img=23",
    rating: 5,
    text: "Our first time using a boat sitter and we could not have felt more reassured. Great with the systems, our dog, and the marina team.",
    createdAt: "2025-10-08T11:15:00.000Z",
    location: "Brighton, United Kingdom",
  },
  {
    id: "review-harbour-samira",
    sitId: "harbour-light-historic",
    boatName: "Harbour Light",
    applicationId: "application-samira-harbour",
    sitterName: "Samira Costa",
    ownerName: "Elena Rossi",
    ownerImage: "https://i.pravatar.cc/100?img=32",
    rating: 4,
    text: "Samira was reliable with lines, pets and weekly updates. A small delay reporting a shore-power trip, but otherwise excellent care.",
    createdAt: "2026-04-02T16:00:00.000Z",
    location: "Cascais, Portugal",
  },
  {
    id: "review-north-theo",
    sitId: "north-channel-historic",
    boatName: "North Channel",
    applicationId: "application-theo-north",
    sitterName: "Theo Janssen",
    ownerName: "Ingrid Berg",
    ownerImage: "https://i.pravatar.cc/100?img=41",
    rating: 4,
    text: "Theo handled engine checks confidently and kept the boat tidy. Would welcome him back for a longer sit.",
    createdAt: "2026-03-18T09:45:00.000Z",
    location: "Amsterdam, Netherlands",
  },
];

function readReviews(): SitReview[] {
  if (!localStorage.getItem(REVIEWS_SEED_KEY)) {
    localStorage.removeItem("harbourly-reviews");
    localStorage.setItem(REVIEWS_SEED_KEY, "complete");
  }
  try {
    const stored = JSON.parse(localStorage.getItem("harbourly-reviews") ?? "[]") as SitReview[];
    const storedIds = new Set(stored.map((review) => review.id));
    return [
      ...stored.filter((review) => review.id && review.sitterName && review.rating),
      ...seededReviews.filter((review) => !storedIds.has(review.id)),
    ];
  } catch {
    return seededReviews;
  }
}

function writeReviews(reviews: SitReview[]) {
  localStorage.setItem("harbourly-reviews", JSON.stringify(reviews));
}

function sortReviewsNewest(reviews: SitReview[]) {
  return [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function summarizeSitterRating(reviews: SitReview[]): SitterRatingSummary {
  if (!reviews.length) return { average: 0, count: 0 };
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}

export async function getReviewsForSitter(sitterName: string): Promise<SitReview[]> {
  if (await hasApiSession()) {
    try {
      return (await apiGetReviewsForSitter(sitterName)) as SitReview[];
    } catch {
      // Fall through.
    }
  }
  await wait(200);
  return sortReviewsNewest(readReviews().filter((review) => review.sitterName === sitterName));
}

export async function getSitterRatingSummary(sitterName: string): Promise<SitterRatingSummary> {
  const reviews = await getReviewsForSitter(sitterName);
  return summarizeSitterRating(reviews);
}

export async function getReviewForApplication(applicationId: string): Promise<SitReview | null> {
  if (await hasApiSession()) {
    try {
      return (await apiGetReviewForApplication(applicationId)) as SitReview | null;
    } catch {
      // Fall through.
    }
  }
  await wait(150);
  return readReviews().find((review) => review.applicationId === applicationId) ?? null;
}

export async function getPublicMemberProfile(name: string): Promise<PublicMemberProfile | null> {
  if (await hasApiSession()) {
    try {
      return await apiGetPublicProfile(name);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        // Fall through to application snapshot.
      } else {
        // Fall through.
      }
    }
  }
  await wait(200);
  const fromApplication = readApplications().find(
    (application) => application.applicant.name === name,
  )?.applicant;
  if (fromApplication) {
    return {
      name: fromApplication.name,
      image: fromApplication.image,
      location: fromApplication.location,
      bio: fromApplication.bio,
      languages: fromApplication.languages,
      preferredCountries: fromApplication.preferredCountries,
      skills: fromApplication.skills,
      yearsExperience: fromApplication.yearsExperience,
      certifications: fromApplication.certifications,
      memberSince: fromApplication.memberSince,
      completedSits: fromApplication.completedSits,
    };
  }
  return null;
}

export async function createReview(input: {
  applicationId: string;
  rating: number;
  text: string;
  ownerName: string;
}): Promise<SitReview> {
  if (await hasApiSession()) {
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

  await wait(500);
  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) throw new Error("REVIEW_INVALID_RATING");
  const text = input.text.trim();
  if (text.length < 20) throw new Error("REVIEW_TEXT_TOO_SHORT");
  const application = readApplications().find((item) => item.id === input.applicationId);
  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  if (application.status !== "accepted") throw new Error("REVIEW_APPLICATION_NOT_ACCEPTED");
  if (application.ownerName !== input.ownerName) throw new Error("REVIEW_OWNER_ONLY");
  const sit = readSits().find((item) => item.id === application.sitId);
  const acceptedIds = acceptedSitIds();
  const listing = joinSit(sit, readVessels(), acceptedIds);
  if (!listing || !canLeaveReview(listing)) {
    if (!listing || !isSitCompletedForReview(listing)) {
      throw new Error("REVIEW_SIT_NOT_COMPLETED");
    }
    throw new Error("REVIEW_WINDOW_CLOSED");
  }
  const reviews = readReviews();
  if (reviews.some((review) => review.applicationId === input.applicationId)) {
    throw new Error("REVIEW_ALREADY_EXISTS");
  }
  const review: SitReview = {
    id: `review-${Date.now()}`,
    sitId: application.sitId,
    boatName: application.boatName,
    applicationId: application.id,
    sitterName: application.applicant.name,
    ownerName: application.ownerName,
    ownerImage:
      application.ownerImage ||
      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(application.ownerName)}`,
    rating,
    text,
    createdAt: new Date().toISOString(),
    location: listing ? `${listing.location}, ${listing.country}` : application.boatName,
  };
  writeReviews([review, ...reviews]);
  return review;
}

export async function respondToReview(input: {
  reviewId: string;
  sitterName: string;
  text: string;
}): Promise<SitReview> {
  if (await hasApiSession()) {
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

  await wait(400);
  const text = input.text.trim();
  if (text.length < 8) throw new Error("REVIEW_RESPONSE_TOO_SHORT");
  const reviews = readReviews();
  const existing = reviews.find((review) => review.id === input.reviewId);
  if (!existing) throw new Error("REVIEW_NOT_FOUND");
  if (existing.sitterName !== input.sitterName) throw new Error("REVIEW_SITTER_ONLY");
  if (existing.response) throw new Error("REVIEW_RESPONSE_EXISTS");
  const updated: SitReview = {
    ...existing,
    response: {
      text,
      createdAt: new Date().toISOString(),
    },
  };
  writeReviews(reviews.map((review) => (review.id === input.reviewId ? updated : review)));
  return updated;
}
