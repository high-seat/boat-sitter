import type { NewSit, NewVessel } from "./schema";
import type { SeedAvailability, SeedProfile, SeedUser } from "./seed-data";

/**
 * Bulk seed data, generated procedurally so the marketplace feels populated for
 * testing: extra owners + sitters, boats, sits, applications, availability
 * windows and reviews. Merged with the hand-written base set in
 * scripts/generate-seed-sql.ts.
 *
 * Everything is deterministic (index-based, no randomness) and every id is
 * `seed-` prefixed so the generator's scoped deletes only ever touch seed rows —
 * safe against production.
 *
 * Names are the linking key: a vessel's `owner` and an application's
 * `applicant.name` match a user's `name`, so the generator can resolve
 * owner_user_id / applicant_user_id without embedding ids here.
 */

export interface SeedApplicationLike {
  id: string;
  sitId: string;
  boatName: string;
  ownerName: string;
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
  };
  initialMessage: string;
  status: string;
  createdAt: string;
  messages: { id: string; senderName: string; text: string; createdAt: string }[];
}

export interface SeedReview {
  id: string;
  sitId: string;
  boatName: string;
  applicationId: string;
  sitterName: string;
  sitterUserId: string;
  ownerName: string;
  ownerUserId: string;
  ownerImage: string;
  rating: number;
  text: string;
  location: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Pools
// ---------------------------------------------------------------------------

const NEW_OWNERS = [
  {
    name: "Sofia Moreau",
    location: "Antibes, France",
    bio: "Charter skipper turned owner on the Côte d'Azur.",
    languages: ["French", "English"],
  },
  {
    name: "Liam O'Connor",
    location: "Southampton, United Kingdom",
    bio: "Weekend racer who keeps a tidy bilge.",
    languages: ["English"],
  },
  {
    name: "Yuki Tanaka",
    location: "Auckland, New Zealand",
    bio: "Bluewater cruiser, Pacific bound.",
    languages: ["Japanese", "English"],
  },
  {
    name: "Diego Alvarez",
    location: "Barcelona, Spain",
    bio: "Med sailor who loves a long lunch at anchor.",
    languages: ["Spanish", "Catalan", "English"],
  },
  {
    name: "Freya Larsen",
    location: "Gothenburg, Sweden",
    bio: "Archipelago explorer, summer sailor.",
    languages: ["Swedish", "English"],
  },
  {
    name: "Marco Rossi",
    location: "Naples, Italy",
    bio: "Restored a classic ketch by hand.",
    languages: ["Italian", "English"],
  },
  {
    name: "Amara Okafor",
    location: "Valletta, Malta",
    bio: "Liveaboard owner, warm-water wanderer.",
    languages: ["English"],
  },
  {
    name: "Ben Whitfield",
    location: "Fort Lauderdale, United States",
    bio: "Motor-yacht owner, ICW regular.",
    languages: ["English"],
  },
  {
    name: "Elena Petrova",
    location: "Marmaris, Türkiye",
    bio: "Gulet lover cruising the Turquoise Coast.",
    languages: ["Russian", "Turkish", "English"],
  },
];

const NEW_SITTERS = [
  {
    name: "Tom Harper",
    location: "Falmouth, United Kingdom",
    bio: "Detail-oriented liveaboard sitter, ex-delivery crew.",
    languages: ["English"],
    preferredCountries: ["United Kingdom", "France", "Spain"],
    skills: ["Diesel troubleshooting", "Rigging", "Mooring & lines"],
    yearsExperience: 8,
    certifications: ["RYA Yachtmaster", "VHF / SRC"],
  },
  {
    name: "Nadia Rahman",
    location: "Valletta, Malta",
    bio: "Marine biologist who house-sits between projects.",
    languages: ["English", "Arabic"],
    preferredCountries: ["Malta", "Italy", "Greece"],
    skills: ["Pet care", "Cleaning", "Snorkel checks"],
    yearsExperience: 3,
    certifications: ["First aid"],
  },
  {
    name: "Oskar Nowak",
    location: "Gdańsk, Poland",
    bio: "Baltic sailor, calm in heavy weather.",
    languages: ["Polish", "English", "German"],
    preferredCountries: ["Sweden", "Denmark", "Germany"],
    skills: ["Storm preparation", "Navigation", "Engine maintenance"],
    yearsExperience: 6,
    certifications: ["ICC", "VHF / SRC"],
  },
  {
    name: "Chloe Dubois",
    location: "Nice, France",
    bio: "Riviera local, tidy and reliable.",
    languages: ["French", "English", "Italian"],
    preferredCountries: ["France", "Italy", "Monaco"],
    skills: ["Pet care", "Tender handling", "Cleaning"],
    yearsExperience: 4,
    certifications: ["First aid"],
  },
  {
    name: "Rafael Santos",
    location: "Lisbon, Portugal",
    bio: "Atlantic crossing under his belt; loves boat dogs.",
    languages: ["Portuguese", "English", "Spanish"],
    preferredCountries: ["Portugal", "Spain", "Cabo Verde"],
    skills: ["Diesel troubleshooting", "Mooring & lines", "Pet care"],
    yearsExperience: 5,
    certifications: ["RYA Day Skipper", "First aid"],
  },
  {
    name: "Mei Lin",
    location: "Auckland, New Zealand",
    bio: "Southern-hemisphere sitter, flexible and handy.",
    languages: ["English", "Mandarin"],
    preferredCountries: ["New Zealand", "Australia"],
    skills: ["12V electrical", "Cleaning", "Mooring & lines"],
    yearsExperience: 4,
    certifications: ["VHF / SRC"],
  },
];

const LOCATIONS = [
  { location: "Palma", country: "Spain", lat: 39.5696, lng: 2.6502 },
  { location: "Split", country: "Croatia", lat: 43.5081, lng: 16.4402 },
  { location: "Antibes", country: "France", lat: 43.5808, lng: 7.1251 },
  { location: "Naples", country: "Italy", lat: 40.8518, lng: 14.2681 },
  { location: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393 },
  { location: "Valletta", country: "Malta", lat: 35.8989, lng: 14.5146 },
  { location: "Corfu", country: "Greece", lat: 39.6243, lng: 19.9217 },
  { location: "Dubrovnik", country: "Croatia", lat: 42.6507, lng: 18.0944 },
  { location: "Barcelona", country: "Spain", lat: 41.3874, lng: 2.1686 },
  { location: "Marmaris", country: "Türkiye", lat: 36.855, lng: 28.274 },
  { location: "Auckland", country: "New Zealand", lat: -36.8485, lng: 174.7633 },
  { location: "Fort Lauderdale", country: "United States", lat: 26.1224, lng: -80.1373 },
  { location: "Gothenburg", country: "Sweden", lat: 57.7089, lng: 11.9746 },
  { location: "Southampton", country: "United Kingdom", lat: 50.9097, lng: -1.4044 },
];

const IMG_IDS = [
  "photo-1540946485063-a40da27545f8",
  "photo-1569263979104-865ab7cd8d13",
  "photo-1516132006923-6cf348e5dee2",
  "photo-1502680390469-be75c86b636f",
  "photo-1544551763-46a013bb70d5",
  "photo-1473116763249-2faaef81ccda",
  "photo-1567899378494-47b22a2ae96a",
  "photo-1507525428034-b723cf961d3e",
];
const img = (i: number, w = 1400) =>
  `https://images.unsplash.com/${IMG_IDS[i % IMG_IDS.length]}?auto=format&fit=crop&w=${w}&q=85`;

const BOAT_NAMES = [
  "Aurora",
  "Tempest",
  "Meridian",
  "Halcyon",
  "Odyssey",
  "Zephyr",
  "Nimbus",
  "Corsair",
  "Marlin",
  "Serenity",
  "Albatross",
  "Nautilus",
  "Osprey",
  "Mistral",
];
const TYPES = ["Sailing yacht", "Catamaran", "Motor yacht", "Trawler", "Ketch", "Sloop"];
const LENGTHS = ["32 ft", "38 ft", "41 ft", "46 ft", "52 ft", "58 ft"];
const ENGINES = ["Inboard diesel", "Outboard", "Saildrive"];
const VOLTAGES = ["12 V DC", "24 V DC"];
const STOVES = ["LPG / propane", "Diesel", "Electric"];
const SYSTEMS = [
  ["Volvo Penta diesel", "Solar array", "AIS"],
  ["Yanmar diesel", "Wind generator", "Radar", "Chartplotter"],
  ["Solar array", "Watermaker", "Bow thruster"],
  ["Inboard diesel", "Chartplotter", "Autopilot"],
];
const AMENITIES = [
  ["Wi-Fi", "Shore power", "Dinghy"],
  ["Wi-Fi", "Bicycles", "Paddleboard"],
  ["Shore power", "Air conditioning", "Fridge/freezer"],
  ["Wi-Fi", "Heating", "Dinghy", "Snorkel gear"],
];
const RESPONSIBILITIES = [
  ["Check bilge daily", "Run engine weekly", "Monitor batteries"],
  ["Water the plants", "Wipe down teak", "Check mooring lines"],
  ["Feed the cat", "Ventilate the cabin", "Monitor batteries"],
  ["Run engine weekly", "Check mooring lines", "Rinse decks after rain"],
];
const DURATIONS = ["7 nights", "10 nights", "14 nights", "21 nights", "28 nights"];
const STATUSES = ["new", "shortlisted", "accepted", "declined", "new"];
const REVIEW_TEXTS = [
  "Left the boat spotless and kept us updated the whole time. Would have back in a heartbeat.",
  "Handled a surprise storm calmly and looked after every system. Total peace of mind.",
  "Wonderful with our cat and meticulous with the checks. Highly recommended.",
  "Practical, reliable and easy to communicate with. A brilliant sitter.",
  "Treated the boat like their own. Everything ship-shape on our return.",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OWNER_IMG = (i: number) => `https://i.pravatar.cc/160?img=${20 + i}`;
const SITTER_IMG = (i: number) => `https://i.pravatar.cc/160?img=${30 + i}`;

function slug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const email = (name: string) => `${slug(name)}@seed.boatstead.test`;
const userId = (name: string) => `seed-user-${slug(name)}`;

function isoDate(baseDays: number) {
  const d = new Date(Date.UTC(2026, 4, 1)); // 2026-05-01
  d.setUTCDate(d.getUTCDate() + baseDays);
  return d.toISOString().slice(0, 10);
}
function prettyRange(startDays: number, nights: number) {
  const s = new Date(Date.UTC(2026, 4, 1));
  s.setUTCDate(s.getUTCDate() + startDays);
  const e = new Date(s);
  e.setUTCDate(e.getUTCDate() + nights);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${fmt(s)} – ${fmt(e)}`;
}

// ---------------------------------------------------------------------------
// Users + profiles
// ---------------------------------------------------------------------------

export const extraUsers: SeedUser[] = [
  ...NEW_OWNERS.map((o, i) => ({
    id: userId(o.name),
    name: o.name,
    email: email(o.name),
    emailVerified: true,
    image: OWNER_IMG(i),
    role: "owner" as const,
  })),
  ...NEW_SITTERS.map((s, i) => ({
    id: userId(s.name),
    name: s.name,
    email: email(s.name),
    emailVerified: true,
    image: SITTER_IMG(i),
    role: "sitter" as const,
  })),
];

export const extraProfiles: SeedProfile[] = [
  ...NEW_OWNERS.map((o, i) => ({
    userId: userId(o.name),
    name: o.name,
    email: email(o.name),
    image: OWNER_IMG(i),
    location: o.location,
    bio: o.bio,
    languages: o.languages,
    preferredCountries: [],
    skills: [],
    yearsExperience: 0,
    certifications: [],
    memberSince: 2020 + (i % 5),
  })),
  ...NEW_SITTERS.map((s, i) => ({
    userId: userId(s.name),
    name: s.name,
    email: email(s.name),
    image: SITTER_IMG(i),
    location: s.location,
    bio: s.bio,
    languages: s.languages,
    preferredCountries: s.preferredCountries,
    skills: s.skills,
    yearsExperience: s.yearsExperience,
    certifications: s.certifications,
    memberSince: 2019 + (i % 6),
  })),
];

// ---------------------------------------------------------------------------
// Vessels + sits
// ---------------------------------------------------------------------------

const VESSEL_COUNT = 14;

export const extraVessels: NewVessel[] = Array.from({ length: VESSEL_COUNT }, (_, i) => {
  const owner = NEW_OWNERS[i % NEW_OWNERS.length];
  const loc = LOCATIONS[i % LOCATIONS.length];
  const type = TYPES[i % TYPES.length];
  return {
    id: `seed-vessel-${i + 1}`,
    name: BOAT_NAMES[i % BOAT_NAMES.length],
    type,
    length: LENGTHS[i % LENGTHS.length],
    yearBuilt: 1998 + (i % 25),
    homePort: `${loc.location}, ${loc.country}`,
    fullAddress: `Marina berth, ${loc.location}, ${loc.country}`,
    image: img(i),
    gallery: [img(i + 1, 900), img(i + 2, 900)],
    owner: owner.name,
    ownerImage: OWNER_IMG(i % NEW_OWNERS.length),
    rating: Number((4.2 + (i % 8) * 0.1).toFixed(1)),
    reviews: 3 + (i % 10),
    description: `A well-kept ${type.toLowerCase()} based in ${loc.location}. Ready for a careful sitter to keep her happy between trips.`,
    home: "Comfortable cabin with a proper berth, galley and everything you need aboard.",
    systems: SYSTEMS[i % SYSTEMS.length],
    engineType: ENGINES[i % ENGINES.length],
    voltageType: VOLTAGES[i % VOLTAGES.length],
    stoveFuelType: STOVES[i % STOVES.length],
    amenities: AMENITIES[i % AMENITIES.length],
  } as NewVessel;
});

export const extraSits: NewSit[] = Array.from({ length: VESSEL_COUNT }, (_, i) => {
  const loc = LOCATIONS[i % LOCATIONS.length];
  const startDays = i * 13;
  const nights = Number.parseInt(DURATIONS[i % DURATIONS.length], 10);
  return {
    id: `seed-sit-${i + 1}`,
    vesselId: `seed-vessel-${i + 1}`,
    dates: prettyRange(startDays, nights),
    dateStart: isoDate(startDays),
    duration: DURATIONS[i % DURATIONS.length],
    location: loc.location,
    country: loc.country,
    fullAddress: null,
    latitude: loc.lat,
    longitude: loc.lng,
    responsibilities: RESPONSIBILITIES[i % RESPONSIBILITIES.length],
    requirements:
      i % 2 === 0 ? ["Some sailing experience"] : ["Comfortable with pets", "Non-smoker"],
    minYearsExperience: i % 3,
    requiredExperience: [],
    requiredCertifications: [],
    requiredSkills: [],
    applicants: 0, // patched below from generated applications
    pet: i % 4 === 0 ? "Cat" : null,
    featured: i < 3,
    published: true,
    sitType: i % 3 === 0 ? "daytimeChecks" : "liveaboard",
  } as NewSit;
});

// ---------------------------------------------------------------------------
// Applications (sitters applying to sits) + applicant counts
// ---------------------------------------------------------------------------

const applications: SeedApplicationLike[] = [];
extraSits.forEach((sit, i) => {
  const numApps = i % 3; // 0,1,2 cycle
  for (let a = 0; a < numApps; a++) {
    const s = NEW_SITTERS[(i + a) % NEW_SITTERS.length];
    const vessel = extraVessels[i];
    const created = `2026-04-${String(10 + ((i + a) % 18)).padStart(2, "0")}T09:30:00.000Z`;
    const message = `Hi ${vessel.owner.split(" ")[0]}, I'd love to look after ${vessel.name}. I have ${s.yearsExperience} years of experience and I'm confident with the routine checks.`;
    applications.push({
      id: `seed-app-${i + 1}-${a + 1}`,
      sitId: sit.id!,
      boatName: vessel.name!,
      ownerName: vessel.owner!,
      applicant: {
        name: s.name,
        image: SITTER_IMG(NEW_SITTERS.indexOf(s)),
        location: s.location,
        bio: s.bio,
        languages: s.languages,
        preferredCountries: s.preferredCountries,
        skills: s.skills,
        yearsExperience: s.yearsExperience,
        certifications: s.certifications,
      },
      initialMessage: message,
      status: STATUSES[(i + a) % STATUSES.length],
      createdAt: created,
      messages: [
        {
          id: `seed-msg-${i + 1}-${a + 1}`,
          senderName: s.name,
          text: message,
          createdAt: created,
        },
      ],
    });
  }
  // Reflect the count on the sit.
  (sit as { applicants: number }).applicants = numApps;
});

export const extraApplications = applications;

// ---------------------------------------------------------------------------
// Availability windows (one per new sitter)
// ---------------------------------------------------------------------------

export const extraAvailability: SeedAvailability[] = NEW_SITTERS.map((s, i) => ({
  id: `seed-avail-${slug(s.name)}`,
  sitterUserId: userId(s.name),
  sitterName: s.name,
  dateStart: isoDate(i * 9),
  dateEnd: isoDate(i * 9 + 90),
  regions: i % 3 === 2 ? [] : s.preferredCountries,
  notes:
    i % 2 === 0 ? "Flexible on exact dates for the right boat." : "Available for liveaboard sits.",
  status: "open",
}));

// ---------------------------------------------------------------------------
// Reviews (received by sitters) — makes profiles/listings feel established
// ---------------------------------------------------------------------------

export const extraReviews: SeedReview[] = Array.from({ length: 12 }, (_, j) => {
  const vessel = extraVessels[j % extraVessels.length];
  const sit = extraSits[j % extraSits.length];
  const owner = NEW_OWNERS[j % NEW_OWNERS.length];
  const sitter = NEW_SITTERS[j % NEW_SITTERS.length];
  const loc = LOCATIONS[j % LOCATIONS.length];
  return {
    id: `seed-review-${j + 1}`,
    sitId: sit.id!,
    boatName: vessel.name!,
    applicationId: `seed-review-app-${j + 1}`,
    sitterName: sitter.name,
    sitterUserId: userId(sitter.name),
    ownerName: owner.name,
    ownerUserId: userId(owner.name),
    ownerImage: OWNER_IMG(j % NEW_OWNERS.length),
    rating: 4 + (j % 2),
    text: REVIEW_TEXTS[j % REVIEW_TEXTS.length],
    location: `${loc.location}, ${loc.country}`,
    createdAt: `2026-03-${String(5 + j).padStart(2, "0")}T12:00:00.000Z`,
  };
});
