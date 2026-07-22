import type { NewSit, NewVessel } from "./schema";

/**
 * Single source of truth for dev seed data.
 *
 * Used by:
 *  - POST /api/dev/reset            (dev console "Reset database")
 *  - scripts/generate-seed-sql.ts   (regenerates scripts/seed.sql for the CLI)
 *
 * After editing, run: npm run db:seed:generate
 *
 * A boat listing = a vessel joined to a sit. Vessel ids end in "-boat" so the
 * sit id can stay the clean slug used in URLs (/boats/solstice).
 */

export const seedVessels: NewVessel[] = [
  {
    id: "solstice-boat",
    name: "Solstice",
    type: "Sailing yacht",
    length: "42 ft",
    homePort: "Lefkada, Greece",
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
    description:
      "Solstice is our much-loved bluewater cruiser, tucked into a quiet marina on Lefkada. We need a confident liveaboard to keep her aired, secure and happy while we visit family.",
    home: "Private aft cabin, full galley and a bright saloon. The marina has showers, laundry, a pool and tavernas a short walk away.",
    systems: ["Yanmar diesel", "12V / solar", "Watermaker", "Electric windlass"],
    engineType: "Inboard diesel",
    voltageType: "12 V DC",
    stoveFuelType: "LPG / propane",
    amenities: [
      "Bathroom",
      "Full kitchen",
      "Air conditioning",
      "Wi-Fi",
      "Swimming pool",
      "Tender",
      "Paddleboard",
      "Shore power",
    ],
  },
  {
    id: "blue-hour-boat",
    name: "Blue Hour",
    type: "Catamaran",
    length: "46 ft",
    homePort: "St. George's, Grenada",
    image:
      "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    owner: "Jonas",
    ownerImage: "https://i.pravatar.cc/160?img=12",
    rating: 5,
    reviews: 11,
    description:
      "A spacious Lagoon catamaran on a sheltered mooring. Ideal for a couple who know tropical weather routines and are comfortable using a dinghy.",
    home: "Owner's hull, island galley, water views from every window and reliable marina Wi-Fi.",
    systems: ["Twin Yanmar diesels", "Lithium bank", "Solar array", "Dinghy outboard"],
    engineType: "Inboard diesel",
    voltageType: "24 V DC",
    stoveFuelType: "LPG / propane",
    amenities: [
      "Bathroom",
      "Full kitchen",
      "Wi-Fi",
      "Kayak",
      "Tender",
      "Outdoor BBQ",
      "Washing machine",
    ],
  },
  {
    id: "northern-light-boat",
    name: "Northern Light",
    type: "Motor yacht",
    length: "38 ft",
    homePort: "Bergen, Norway",
    image:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1520645521318-f03a712f0e67?auto=format&fit=crop&w=900&q=85",
    ],
    owner: "Ingrid",
    ownerImage: "https://i.pravatar.cc/160?img=32",
    rating: 4.7,
    reviews: 6,
    description:
      "Winter berth in a working harbour. The job is mostly about heat, humidity and shore power — she must not be left to freeze.",
    home: "Heated saloon with a diesel stove, compact galley, and a short walk into town.",
    systems: ["Volvo Penta diesel", "Diesel heater", "Shore power", "Dehumidifier"],
    engineType: "Inboard diesel",
    voltageType: "12 V DC",
    stoveFuelType: "Diesel",
    amenities: ["Bathroom", "Full kitchen", "Wi-Fi", "Heating", "Shore power"],
  },
  {
    id: "kingfisher-boat",
    name: "Kingfisher",
    type: "Sailing yacht",
    length: "36 ft",
    homePort: "Whangarei, New Zealand",
    image:
      "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    owner: "Tama & Ruth",
    ownerImage: "https://i.pravatar.cc/160?img=68",
    rating: 4.8,
    reviews: 24,
    description:
      "Our steel ketch sits on a quiet river mooring while we head to the South Island. Cyclone season, so weather awareness matters more than sailing miles.",
    home: "Full run of the boat, wood stove, and a dinghy for the short row ashore.",
    systems: ["Ford Lehman diesel", "Wind generator", "Solar", "Wood stove"],
    engineType: "Inboard diesel",
    voltageType: "12 V DC",
    stoveFuelType: "Diesel",
    amenities: ["Wi-Fi", "Tender", "Bicycles"],
  },
  {
    id: "saltwood-boat",
    name: "Saltwood",
    type: "Sailing yacht",
    length: "31 ft",
    homePort: "Falmouth, United Kingdom",
    image:
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    owner: "Peter",
    ownerImage: "https://i.pravatar.cc/160?img=59",
    rating: 4.6,
    reviews: 9,
    description:
      "A wooden sloop on a pontoon berth. She needs someone patient who understands that a timber hull wants watching, not fixing.",
    home: "Snug forepeak berth, kettle, and the sailing club showers two minutes away.",
    systems: ["Beta 20 diesel", "12V system", "Manual bilge pump"],
    engineType: "Inboard diesel",
    voltageType: "12 V DC",
    stoveFuelType: "Not specified",
    amenities: ["Shore power", "Wi-Fi"],
  },
];

export const seedSits: NewSit[] = [
  {
    id: "solstice",
    vesselId: "solstice-boat",
    dates: "12 Sep – 4 Oct",
    dateStart: "2026-09-12",
    duration: "22 nights",
    location: "Lefkada",
    country: "Greece",
    latitude: 38.7066,
    longitude: 20.7019,
    responsibilities: [
      "Check bilges and battery monitor each morning",
      "Run engine and watermaker weekly",
      "Adjust lines and fenders after strong weather",
      "Flush heads and air cabins regularly",
    ],
    requirements: ["5+ years sailing", "Diesel basics", "Liveaboard experience"],
    minYearsExperience: 5,
    requiredExperience: ["Liveaboard"],
    requiredCertifications: [],
    requiredSkills: ["Diesel troubleshooting", "Mooring & lines"],
    applicants: 6,
    pet: "Pip, a sea-loving terrier",
    featured: true,
    published: true,
  },
  {
    id: "blue-hour",
    vesselId: "blue-hour-boat",
    dates: "3 Nov – 1 Dec",
    dateStart: "2026-11-03",
    duration: "28 nights",
    location: "St. George's",
    country: "Grenada",
    latitude: 12.0561,
    longitude: -61.7488,
    responsibilities: [
      "Daily mooring and chafe inspection",
      "Monitor solar, batteries and fridge",
      "Start both engines weekly",
      "Secure deck before squalls",
    ],
    requirements: ["Catamaran experience", "Dinghy handling", "Storm awareness"],
    minYearsExperience: 3,
    requiredExperience: ["Catamaran", "Tropical weather"],
    requiredCertifications: [],
    requiredSkills: ["Tender handling", "Storm preparation"],
    applicants: 9,
    pet: null,
    featured: false,
    published: true,
  },
  {
    id: "northern-light",
    vesselId: "northern-light-boat",
    dates: "5 Jan – 2 Feb",
    dateStart: "2027-01-05",
    duration: "28 nights",
    location: "Bergen",
    country: "Norway",
    latitude: 60.3913,
    longitude: 5.3221,
    responsibilities: [
      "Verify shore power and heater daily",
      "Check for ice around the hull",
      "Run dehumidifier and log readings",
      "Clear snow from decks and covers",
    ],
    requirements: ["Cold weather experience", "Comfortable alone", "Basic electrics"],
    minYearsExperience: 2,
    requiredExperience: ["Cold-weather boating"],
    requiredCertifications: [],
    requiredSkills: ["Shore power"],
    applicants: 3,
    pet: null,
    featured: false,
    published: true,
  },
  {
    id: "kingfisher",
    vesselId: "kingfisher-boat",
    dates: "18 Feb – 20 Mar",
    dateStart: "2027-02-18",
    duration: "30 nights",
    location: "Whangarei",
    country: "New Zealand",
    latitude: -35.7251,
    longitude: 174.3237,
    responsibilities: [
      "Check mooring bridle for chafe weekly",
      "Monitor forecast for cyclone activity",
      "Run engine and charge batteries",
      "Ventilate to keep damp down",
    ],
    requirements: ["Anchoring experience", "Weather routing", "Dinghy handling"],
    minYearsExperience: 4,
    requiredExperience: ["Bluewater / offshore"],
    requiredCertifications: [],
    requiredSkills: ["Tender handling", "Storm preparation"],
    applicants: 12,
    pet: "Two cats, Rigging and Halyard",
    featured: true,
    published: true,
  },
  {
    id: "saltwood",
    vesselId: "saltwood-boat",
    dates: "1 Apr – 15 Apr",
    dateStart: "2027-04-01",
    duration: "14 nights",
    location: "Falmouth",
    country: "United Kingdom",
    latitude: 50.1533,
    longitude: -5.0656,
    responsibilities: [
      "Check bilge twice daily — she takes up slowly",
      "Inspect topside seams after dry spells",
      "Tend lines on spring tides",
      "Keep her covered and aired",
    ],
    requirements: ["Wooden boat experience preferred", "Tidal berth awareness"],
    minYearsExperience: 0,
    requiredExperience: [],
    requiredCertifications: [],
    requiredSkills: ["Mooring & lines"],
    applicants: 2,
    pet: null,
    featured: false,
    published: true,
  },
];

interface SeedApplication {
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

export const seedApplications: SeedApplication[] = [
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
];
