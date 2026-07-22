import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Data model.
 *
 * The frontend treats a listing as `Boat = vessel ⋈ sit`:
 *   - a **vessel** is the boat itself (name, systems, amenities, owner)
 *   - a **sit** is a period the vessel needs watching (dates, location, duties)
 * One vessel can have many sits over time. The public "boat" a sitter browses is
 * a vessel joined to one of its sits. We model those as two tables and join in
 * the API, mirroring the frontend's `joinSit`.
 *
 * Array-ish fields (gallery, systems, amenities, responsibilities, …) are JSON
 * text columns: always read whole, never joined against.
 */

const jsonArray = (name: string) =>
  text(name, { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`);

export const vessels = sqliteTable(
  "vessels",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    length: text("length").notNull(),
    homePort: text("home_port").notNull(),
    image: text("image").notNull(),
    gallery: jsonArray("gallery"),
    owner: text("owner").notNull(),
    ownerImage: text("owner_image").notNull(),
    rating: real("rating").notNull().default(0),
    reviews: integer("reviews").notNull().default(0),
    description: text("description").notNull(),
    home: text("home").notNull().default(""),
    systems: jsonArray("systems"),
    engineType: text("engine_type").notNull().default("Not specified"),
    voltageType: text("voltage_type").notNull().default("Not specified"),
    stoveFuelType: text("stove_fuel_type").notNull().default("Not specified"),
    amenities: jsonArray("amenities"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("vessels_owner_idx").on(t.owner)],
);

export const sits = sqliteTable(
  "sits",
  {
    id: text("id").primaryKey(),
    vesselId: text("vessel_id")
      .notNull()
      .references(() => vessels.id, { onDelete: "cascade" }),

    dates: text("dates").notNull(),
    dateStart: text("date_start").notNull(),
    duration: text("duration").notNull(),

    // Location on the sit is the display town (country stripped); country is
    // stored separately so the frontend can recombine as needed.
    location: text("location").notNull(),
    country: text("country").notNull(),
    /** Full street/marina address; only returned to owner and accepted sitters. */
    fullAddress: text("full_address"),
    latitude: real("latitude"),
    longitude: real("longitude"),

    responsibilities: jsonArray("responsibilities"),
    requirements: jsonArray("requirements"),
    minYearsExperience: integer("min_years_experience"),
    requiredExperience: jsonArray("required_experience"),
    requiredCertifications: jsonArray("required_certifications"),
    requiredSkills: jsonArray("required_skills"),

    applicants: integer("applicants").notNull().default(0),
    pet: text("pet"),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    published: integer("published", { mode: "boolean" }).notNull().default(true),

    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("sits_vessel_idx").on(t.vesselId),
    index("sits_country_idx").on(t.country),
    index("sits_date_start_idx").on(t.dateStart),
    index("sits_published_idx").on(t.published),
  ],
);

export const applications = sqliteTable(
  "applications",
  {
    id: text("id").primaryKey(),
    sitId: text("sit_id").notNull(),
    boatName: text("boat_name").notNull(),
    ownerName: text("owner_name").notNull(),

    // The applicant snapshot is stored as JSON: it is a point-in-time copy of
    // the sitter's profile at the moment they applied, never queried by field.
    applicant: text("applicant", { mode: "json" })
      .$type<{
        name: string;
        image: string;
        location: string;
        bio: string;
        languages: string[];
        preferredCountries: string[];
        skills: string[];
        yearsExperience: number;
        certifications: string[];
      }>()
      .notNull(),
    applicantName: text("applicant_name").notNull(),

    initialMessage: text("initial_message").notNull(),
    status: text("status").notNull().default("new"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("applications_sit_idx").on(t.sitId),
    index("applications_owner_idx").on(t.ownerName),
    index("applications_applicant_idx").on(t.applicantName),
  ],
);

export const applicationMessages = sqliteTable(
  "application_messages",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    senderName: text("sender_name").notNull(),
    text: text("text").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("application_messages_app_idx").on(t.applicationId)],
);

export const supportRequests = sqliteTable("support_requests", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type Vessel = typeof vessels.$inferSelect;
export type NewVessel = typeof vessels.$inferInsert;
export type Sit = typeof sits.$inferSelect;
export type NewSit = typeof sits.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type ApplicationMessage = typeof applicationMessages.$inferSelect;
export type SupportRequest = typeof supportRequests.$inferSelect;
