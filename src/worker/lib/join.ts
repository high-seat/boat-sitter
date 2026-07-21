import type { Sit, Vessel } from "../db/schema";

/**
 * Joined listing, matching the frontend `Boat` type exactly.
 * Mirrors the frontend's `joinSit`: spread vessel, then sit, with the sit's id
 * as the listing id and the vessel's id exposed as `boatId`.
 */
export interface Boat {
  id: string;
  boatId: string;
  name: string;
  type: string;
  length: string;
  location: string;
  country: string;
  region: string;
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
}

export function joinBoat(vessel: Vessel, sit: Sit): Boat {
  return {
    id: sit.id,
    boatId: vessel.id,
    name: vessel.name,
    type: vessel.type,
    length: vessel.length,
    location: sit.location,
    country: sit.country,
    region: sit.region,
    latitude: sit.latitude,
    longitude: sit.longitude,
    homePort: vessel.homePort,
    dates: sit.dates,
    dateStart: sit.dateStart,
    duration: sit.duration,
    image: vessel.image,
    gallery: vessel.gallery,
    owner: vessel.owner,
    ownerImage: vessel.ownerImage,
    rating: vessel.rating,
    reviews: vessel.reviews,
    applicants: sit.applicants,
    description: vessel.description,
    home: vessel.home,
    responsibilities: sit.responsibilities,
    systems: vessel.systems,
    engineType: vessel.engineType,
    voltageType: vessel.voltageType,
    stoveFuelType: vessel.stoveFuelType,
    requirements: sit.requirements,
    minYearsExperience: sit.minYearsExperience,
    requiredExperience: sit.requiredExperience,
    requiredCertifications: sit.requiredCertifications,
    requiredSkills: sit.requiredSkills,
    amenities: vessel.amenities,
    pet: sit.pet,
    featured: sit.featured,
  };
}
