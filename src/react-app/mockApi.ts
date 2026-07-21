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

const boats: Boat[] = [
  {
    id: "solstice",
    name: "Solstice",
    type: "Sailing yacht",
    length: "42 ft",
    location: "Lefkada, Greece",
    country: "Greece",
    region: "Mediterranean",
    latitude: 38.7066,
    longitude: 20.7019,
    homePort: "Lefkada, Greece",
    dates: "12 Sep – 4 Oct",
    dateStart: "2026-09-12",
    duration: "22 nights",
    image:
      "https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=900&q=85",
    ],
    owner: "Maya & Finn",
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
    requirements: ["5+ years sailing", "Diesel basics", "Liveaboard experience"],
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
  },
  {
    id: "blue-hour",
    name: "Blue Hour",
    type: "Catamaran",
    length: "46 ft",
    location: "St. George’s, Grenada",
    country: "Grenada",
    region: "Caribbean",
    latitude: 12.0561,
    longitude: -61.7488,
    homePort: "St. George’s, Grenada",
    dates: "3 Nov – 1 Dec",
    dateStart: "2026-11-03",
    duration: "28 nights",
    image:
      "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    owner: "Jonas",
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
    length: "55 ft",
    location: "Palma, Mallorca",
    country: "Spain",
    region: "Mediterranean",
    latitude: 39.5696,
    longitude: 2.6502,
    homePort: "Palma, Mallorca, Spain",
    dates: "18 Oct – 8 Nov",
    dateStart: "2026-10-18",
    duration: "21 nights",
    image:
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    owner: "Elena",
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
    length: "58 ft",
    location: "Bath, England",
    country: "United Kingdom",
    region: "United Kingdom",
    latitude: 51.3811,
    longitude: -2.359,
    homePort: "Bath, England, United Kingdom",
    dates: "6 Aug – 20 Aug",
    dateStart: "2026-08-06",
    duration: "14 nights",
    image:
      "https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    owner: "Tom & Ada",
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
    length: "48 ft",
    location: "Vancouver, Canada",
    country: "Canada",
    region: "North America",
    latitude: 49.2827,
    longitude: -123.1207,
    homePort: "Vancouver, Canada",
    dates: "10 Jan – 7 Feb",
    dateStart: "2027-01-10",
    duration: "28 nights",
    image:
      "https://images.unsplash.com/photo-1535024966841-1ea9d9b2b0c7?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    owner: "Clare",
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
    length: "62 ft",
    location: "Sausalito, California",
    country: "United States",
    region: "North America",
    latitude: 37.8591,
    longitude: -122.4853,
    homePort: "Sausalito, California, United States",
    dates: "2 Sep – 16 Sep",
    dateStart: "2026-09-02",
    duration: "14 nights",
    image:
      "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    owner: "Rachel",
    ownerImage: "https://i.pravatar.cc/160?img=26",
    rating: 4.7,
    reviews: 15,
    applicants: 7,
    description:
      "A design-led floating home with a tender and two resident hens ashore. No cruising required, just attentive houseboat care.",
    home: "Two bedrooms, chef’s kitchen, roof deck and spectacular bay views.",
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

const generatedBoatImages = [
  "https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1400&q=85",
] as const;

const nonBoatImageReplacements: Record<string, string> = {
  "https://images.unsplash.com/photo-1528150177508-7cc0c36cda5c?auto=format&fit=crop&w=1400&q=85":
    generatedBoatImages[0],
  "https://images.unsplash.com/photo-1499403474843-04e72c14df8a?auto=format&fit=crop&w=1400&q=85":
    generatedBoatImages[1],
  "https://images.unsplash.com/photo-1566847438217-76e82d383f84?auto=format&fit=crop&w=900&q=85":
    generatedBoatImages[1],
  "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=85":
    generatedBoatImages[2],
};

function ensureBoatImage(image: string) {
  return nonBoatImageReplacements[image] ?? image;
}

const generatedDestinations = [
  ["Antibes", "France", "Mediterranean", 43.5804, 7.1251],
  ["Monaco", "Monaco", "Mediterranean", 43.7384, 7.4246],
  ["Split", "Croatia", "Adriatic", 43.5081, 16.4402],
  ["Dubrovnik", "Croatia", "Adriatic", 42.6507, 18.0944],
  ["Corfu", "Greece", "Mediterranean", 39.6243, 19.9217],
  ["Bodrum", "Turkey", "Aegean", 37.0344, 27.4305],
  ["Marmaris", "Turkey", "Aegean", 36.855, 28.2742],
  ["Lisbon", "Portugal", "Atlantic", 38.7223, -9.1393],
  ["Lagos", "Portugal", "Atlantic", 37.1028, -8.6742],
  ["Barcelona", "Spain", "Mediterranean", 41.3874, 2.1686],
  ["Valencia", "Spain", "Mediterranean", 39.4699, -0.3763],
  ["Naples", "Italy", "Mediterranean", 40.8518, 14.2681],
  ["Sardinia", "Italy", "Mediterranean", 39.2238, 9.1217],
  ["Malta", "Malta", "Mediterranean", 35.8989, 14.5146],
  ["Amsterdam", "Netherlands", "Northern Europe", 52.3676, 4.9041],
  ["Southampton", "United Kingdom", "Northern Europe", 50.9097, -1.4044],
  ["Auckland", "New Zealand", "South Pacific", -36.8509, 174.7645],
  ["Sydney", "Australia", "South Pacific", -33.8688, 151.2093],
  ["Nassau", "Bahamas", "Caribbean", 25.0443, -77.3504],
  ["Road Town", "British Virgin Islands", "Caribbean", 18.4285, -64.6185],
  ["Fort Lauderdale", "United States", "North America", 26.1224, -80.1373],
  ["San Diego", "United States", "North America", 32.7157, -117.1611],
  ["Annapolis", "United States", "North America", 38.9784, -76.4922],
  ["Victoria", "Canada", "North America", 48.4284, -123.3656],
  ["Cartagena", "Colombia", "Caribbean", 10.391, -75.4794],
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

const generatedBoatNameSuffixes = [
  "Tide",
  "Compass",
  "Lark",
  "Horizon",
  "Dolphin",
] as const;

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

function generatedDateDetails(index: number) {
  const absoluteMonth = 7 + index;
  const start = new Date(
    Date.UTC(
      2026 + Math.floor(absoluteMonth / 12),
      absoluteMonth % 12,
      4 + ((index * 7) % 21),
    ),
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
  const [location, country, region, latitude, longitude] =
    generatedDestinations[index % generatedDestinations.length];
  const name = `${generatedBoatNamePrefixes[index % generatedBoatNamePrefixes.length]} ${
    generatedBoatNameSuffixes[Math.floor(index / generatedBoatNamePrefixes.length)]
  }`;
  const type = generatedBoatTypes[index % generatedBoatTypes.length];
  const image = generatedBoatImages[index % generatedBoatImages.length];
  const owner = generatedOwners[index % generatedOwners.length];
  const dateDetails = generatedDateDetails(index);
  const hasEngine = type !== "Houseboat";

  return {
    id: `generated-sit-${index + 1}`,
    boatId: `generated-boat-${index + 1}`,
    name,
    type,
    length: `${30 + ((index * 3) % 35)} ft`,
    location: `${location}, ${country}`,
    country,
    region,
    latitude,
    longitude,
    homePort: `${location}, ${country}`,
    ...dateDetails,
    image,
    gallery: [generatedBoatImages[(index + 1) % generatedBoatImages.length]],
    owner,
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

const toVessel = (boat: Boat): Vessel => ({
  id: boat.boatId ?? boat.id,
  name: boat.name,
  type: boat.type,
  length: boat.length,
  homePort: boat.homePort ?? formatHomePort(boat.location, boat.country),
  image: boat.image,
  gallery: boat.gallery,
  owner: boat.owner,
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
});

const toSit = (boat: Boat): Sit => ({
  id: boat.id,
  boatId: boat.boatId ?? boat.id,
  dates: boat.dates,
  dateStart: boat.dateStart,
  duration: boat.duration,
  location: sitLocation(boat.location, boat.country),
  country: boat.country,
  region: boat.region,
  latitude: boat.latitude,
  longitude: boat.longitude,
  responsibilities: boat.responsibilities,
  requirements: boat.requirements,
  minYearsExperience: Number.parseInt(
    boat.requirements.find((requirement) => /\d+\+?\s+years?/i.test(requirement)) ?? "0",
    10,
  ),
  requiredExperience: [],
  requiredCertifications: [],
  requiredSkills: boat.requirements.filter((requirement) => !/\d+\+?\s+years?/i.test(requirement)),
  applicants: boat.applicants,
  pet: boat.pet,
  featured: boat.featured,
});

const GENERATED_VESSELS_SEED_KEY = "boatstead-generated-vessels-v3";
const GENERATED_SITS_SEED_KEY = "boatstead-generated-sits-v3";

function mergeGeneratedVessels(current: Vessel[]) {
  if (localStorage.getItem(GENERATED_VESSELS_SEED_KEY)) return current;
  const generated = generatedBoats.map(toVessel);
  const generatedIds = new Set(generated.map((vessel) => vessel.id));
  const merged = [...current.filter((vessel) => !generatedIds.has(vessel.id)), ...generated];
  localStorage.setItem("harbourly-vessels", JSON.stringify(merged));
  localStorage.setItem(GENERATED_VESSELS_SEED_KEY, "complete");
  return merged;
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
          Omit<Vessel, "engineType" | "voltageType" | "stoveFuelType" | "homePort"> & {
            engineType?: EngineType;
            voltageType?: VoltageType;
            stoveFuelType?: StoveFuelType;
            homePort?: string;
            location?: string;
            country?: string;
          }
        >
      ).map((storedVessel) => {
        const { country = "", location = "", ...vessel } = storedVessel;
        return {
          ...vessel,
          image: ensureBoatImage(vessel.image),
          gallery: vessel.gallery.map(ensureBoatImage),
          engineType: vessel.engineType ?? "Not specified",
          voltageType: vessel.voltageType ?? "Not specified",
          stoveFuelType: vessel.stoveFuelType ?? "Not specified",
          homePort: vessel.homePort ?? formatHomePort(location, country),
        };
      });
      return mergeGeneratedVessels(storedVessels);
    } catch {
      // Fall through to the legacy seed.
    }
  }
  const unique = new Map(readLegacyBoats().map((boat) => [boat.boatId ?? boat.id, toVessel(boat)]));
  return mergeGeneratedVessels([...unique.values()]);
}

function readSits(): Sit[] {
  const stored = localStorage.getItem("harbourly-sits");
  if (stored) {
    try {
      const vessels = readVessels();
      const storedSits = (
        JSON.parse(stored) as Array<
          Omit<Sit, "location" | "country" | "region" | "latitude" | "longitude"> &
            Partial<Pick<Sit, "location" | "country" | "region" | "latitude" | "longitude">>
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
          location: sit.location ?? fallback.location,
          country: sit.country ?? fallback.country,
          region: sit.region ?? "",
          latitude: sit.latitude ?? coordinates.latitude,
          longitude: sit.longitude ?? coordinates.longitude,
        };
      });
      return mergeGeneratedSits(storedSits);
    } catch {
      // Fall through to the legacy seed.
    }
  }
  return mergeGeneratedSits(readLegacyBoats().map(toSit));
}

function joinSit(sit: Sit | undefined, vessels: Vessel[]): Boat | undefined {
  if (!sit) return undefined;
  const vessel = vessels.find((item) => item.id === sit.boatId);
  if (!vessel) return undefined;
  return { ...vessel, ...sit, id: sit.id, boatId: vessel.id };
}

export async function getBoats(): Promise<Boat[]> {
  await wait();
  const vessels = readVessels();
  return readSits()
    .map((sit) => joinSit(sit, vessels))
    .filter((listing): listing is Boat => Boolean(listing));
}

export async function getBoat(id: string): Promise<Boat | undefined> {
  await wait(220);
  return joinSit(
    readSits().find((sit) => sit.id === id),
    readVessels(),
  );
}

export async function getVessels(): Promise<Vessel[]> {
  await wait(250);
  return readVessels();
}

export async function getSits(): Promise<Sit[]> {
  await wait(250);
  return readSits();
}

export async function saveVessel(vessel: Vessel): Promise<Vessel> {
  await wait(500);
  const current = readVessels();
  const exists = current.some((item) => item.id === vessel.id);
  const next = exists
    ? current.map((item) => (item.id === vessel.id ? vessel : item))
    : [vessel, ...current];
  localStorage.setItem("harbourly-vessels", JSON.stringify(next));
  return vessel;
}

export async function deleteVessel(id: string): Promise<void> {
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
  owner: { name: string; image: string },
): Promise<void> {
  await wait(250);
  localStorage.setItem(
    "harbourly-vessels",
    JSON.stringify(
      readVessels().map((vessel) =>
        vessel.owner === previousName
          ? { ...vessel, owner: owner.name, ownerImage: owner.image }
          : vessel,
      ),
    ),
  );
  writeApplications(
    readApplications().map((application) => ({
      ...application,
      ownerName: application.ownerName === previousName ? owner.name : application.ownerName,
      applicant:
        application.applicant.name === previousName
          ? { ...application.applicant, name: owner.name, image: owner.image }
          : application.applicant,
      messages: application.messages.map((message) =>
        message.senderName === previousName ? { ...message, senderName: owner.name } : message,
      ),
    })),
  );
}

export async function saveSit(sit: Sit): Promise<Sit> {
  await wait(500);
  const current = readSits();
  const exists = current.some((item) => item.id === sit.id);
  const next = exists
    ? current.map((item) => (item.id === sit.id ? sit : item))
    : [sit, ...current];
  localStorage.setItem("harbourly-sits", JSON.stringify(next));
  return sit;
}

export async function deleteSit(id: string): Promise<void> {
  await wait(400);
  localStorage.setItem("harbourly-sits", JSON.stringify(readSits().filter((sit) => sit.id !== id)));
}

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

const seededApplications: SitApplication[] = [
  {
    id: "application-alex-solstice",
    sitId: "solstice",
    boatName: "Solstice",
    ownerName: "Maya & Finn",
    applicant: {
      name: "Alex Morgan",
      image: "https://i.pravatar.cc/160?img=11",
      location: "Brighton, United Kingdom",
      bio: "Calm liveaboard sailor with practical diesel and electrical experience.",
      languages: ["English", "French"],
      preferredCountries: ["Greece", "Croatia", "Italy"],
      skills: ["Diesel troubleshooting", "12V electrical", "Mooring & lines", "Pet care"],
      yearsExperience: 7,
      certifications: ["RYA Day Skipper", "VHF / SRC", "First aid"],
    },
    initialMessage:
      "Hi Maya and Finn, I would love to care for Solstice. I have seven years of liveaboard sailing experience and can confidently handle routine diesel, battery, bilge and line checks.",
    status: "shortlisted",
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
    ],
  },
  {
    id: "application-samira-solstice",
    sitId: "solstice",
    boatName: "Solstice",
    ownerName: "Maya & Finn",
    applicant: {
      name: "Samira Costa",
      image: "https://i.pravatar.cc/160?img=45",
      location: "Lisbon, Portugal",
      bio: "Offshore crew member and experienced pet sitter who works remotely.",
      languages: ["Portuguese", "English", "Spanish"],
      preferredCountries: ["Portugal", "Spain", "Greece"],
      skills: ["Mooring & lines", "Storm preparation", "Pet care", "Tender handling"],
      yearsExperience: 4,
      certifications: ["ICC", "VHF / SRC", "First aid"],
    },
    initialMessage:
      "Hello, Solstice looks wonderful. I have completed several Mediterranean passages and have cared for boats and pets in Portugal, Spain and Greece.",
    status: "new",
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
    applicant: {
      name: "Theo Janssen",
      image: "https://i.pravatar.cc/160?img=15",
      location: "Rotterdam, Netherlands",
      bio: "Mechanical engineer building experience toward longer cruising trips.",
      languages: ["Dutch", "English", "German"],
      preferredCountries: ["Netherlands", "Germany", "Denmark"],
      skills: ["Diesel troubleshooting", "12V electrical", "Solar / lithium"],
      yearsExperience: 2,
      certifications: ["VHF / SRC"],
    },
    initialMessage:
      "Hi, I am a mechanical engineer with two seasons of coastal sailing. I am very comfortable with engines and electrical systems and would be happy to follow a detailed care plan.",
    status: "new",
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
];

function readApplications(): SitApplication[] {
  try {
    const stored = JSON.parse(
      localStorage.getItem("harbourly-applications") ?? "[]",
    ) as SitApplication[];
    const storedIds = new Set(stored.map((application) => application.id));
    return [
      ...stored.filter((application) => application.id && application.applicant),
      ...seededApplications.filter((application) => !storedIds.has(application.id)),
    ];
  } catch {
    return seededApplications;
  }
}

function writeApplications(applications: SitApplication[]) {
  localStorage.setItem("harbourly-applications", JSON.stringify(applications));
}

export async function sendApplication(
  sitId: string,
  message: string,
  applicant: Omit<ApplicationApplicant, "yearsExperience" | "certifications"> & {
    yearsExperience?: number;
    certifications?: string[];
  },
) {
  await wait(700);
  const applications = readApplications();
  const existing = applications.find(
    (application) => application.sitId === sitId && application.applicant.name === applicant.name,
  );
  if (existing) return existing;
  const listing = joinSit(
    readSits().find((sit) => sit.id === sitId),
    readVessels(),
  );
  if (!listing) throw new Error("APPLICATION_SIT_NOT_FOUND");
  const createdAt = new Date().toISOString();
  const application: SitApplication = {
    id: `application-${sitId}-${Date.now()}`,
    sitId,
    boatName: listing.name,
    ownerName: listing.owner,
    applicant: {
      ...applicant,
      yearsExperience: applicant.yearsExperience ?? 0,
      certifications: applicant.certifications ?? [],
    },
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
  return application;
}

export async function getApplicationsForSit(sitId: string): Promise<SitApplication[]> {
  await wait(250);
  return readApplications()
    .filter((application) => application.sitId === sitId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getApplicationsForUser(userName: string): Promise<SitApplication[]> {
  await wait(250);
  return readApplications()
    .filter(
      (application) =>
        application.ownerName === userName || application.applicant.name === userName,
    )
    .sort((a, b) => b.messages.at(-1)!.createdAt.localeCompare(a.messages.at(-1)!.createdAt));
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<SitApplication> {
  await wait(350);
  const applications = readApplications();
  const application = applications.find((item) => item.id === applicationId);
  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  const updated = { ...application, status };
  writeApplications(applications.map((item) => (item.id === applicationId ? updated : item)));
  return updated;
}

export async function sendApplicationMessage(
  applicationId: string,
  senderName: string,
  text: string,
): Promise<SitApplication> {
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
  await wait(650);
  const submission = { ...request, createdAt: new Date().toISOString() };
  const existing = JSON.parse(localStorage.getItem("harbourly-support-requests") ?? "[]");
  localStorage.setItem("harbourly-support-requests", JSON.stringify([...existing, submission]));
  return submission;
}
