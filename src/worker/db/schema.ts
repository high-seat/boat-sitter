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
    /** Calendar year the vessel was built; null when the owner does not know. */
    yearBuilt: integer("year_built"),
    homePort: text("home_port").notNull(),
    image: text("image").notNull(),
    gallery: jsonArray("gallery"),
    owner: text("owner").notNull(),
    ownerImage: text("owner_image").notNull(),
    // The authenticated user who owns this vessel. Null for seed/legacy rows,
    // which are therefore not editable through the API (see vessels route).
    ownerUserId: text("owner_user_id"),
    rating: real("rating").notNull().default(0),
    reviews: integer("reviews").notNull().default(0),
    description: text("description").notNull(),
    home: text("home").notNull().default(""),
    systems: jsonArray("systems"),
    engineType: text("engine_type").notNull().default("Not specified"),
    voltageType: text("voltage_type").notNull().default("Not specified"),
    stoveFuelType: text("stove_fuel_type").notNull().default("Not specified"),
    amenities: jsonArray("amenities"),
    privateAccess: text("private_access", { mode: "json" }).$type<{
      wifiNetwork?: string;
      wifiPassword?: string;
      accessCodes?: string;
      otherNotes?: string;
    } | null>(),
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
    /** liveaboard | daytimeChecks — matches the frontend SitType. */
    sitType: text("sit_type").notNull().default("liveaboard"),

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
    index("sits_sit_type_idx").on(t.sitType),
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
        memberSince?: number;
        completedSits?: number;
      }>()
      .notNull(),
    applicantName: text("applicant_name").notNull(),
    applicantUserId: text("applicant_user_id"),

    initialMessage: text("initial_message").notNull(),
    status: text("status").notNull().default("new"),
    partySize: integer("party_size").notNull().default(1),
    ownerPhone: text("owner_phone"),
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

export type MessagePayload = {
  videoCall?: { startsAt: string; durationMinutes: number };
  sharedPhone?: string;
};

export const applicationMessages = sqliteTable(
  "application_messages",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    senderName: text("sender_name").notNull(),
    text: text("text").notNull(),
    kind: text("kind").notNull().default("user"),
    systemKind: text("system_kind"),
    payload: text("payload", { mode: "json" }).$type<MessagePayload | null>(),
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

/** Extended member profile keyed by Better Auth user id. */
export const profiles = sqliteTable(
  "profiles",
  {
    userId: text("user_id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    legalName: text("legal_name").notNull().default(""),
    image: text("image").notNull().default(""),
    coverImage: text("cover_image"),
    bio: text("bio").notNull().default(""),
    location: text("location").notNull().default(""),
    languages: jsonArray("languages"),
    preferredCountries: jsonArray("preferred_countries"),
    skills: jsonArray("skills"),
    preferredLanguage: text("preferred_language").notNull().default("en-US"),
    measurementSystem: text("measurement_system").notNull().default("metric"),
    emailNotifications: text("email_notifications", { mode: "json" })
      .$type<Record<string, boolean>>()
      .notNull()
      .default(sql`'{}'`),
    sitDefaults: text("sit_defaults", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'`),
    phoneCountryCode: text("phone_country_code").notNull().default("+44"),
    phoneNumber: text("phone_number").notNull().default(""),
    memberSince: integer("member_since").notNull().default(2024),
    yearsExperience: integer("years_experience").notNull().default(0),
    certifications: jsonArray("certifications"),
    completedSits: integer("completed_sits").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("profiles_name_idx").on(t.name)],
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    sitId: text("sit_id").notNull(),
    boatName: text("boat_name").notNull(),
    applicationId: text("application_id").notNull().unique(),
    sitterName: text("sitter_name").notNull(),
    sitterUserId: text("sitter_user_id"),
    ownerName: text("owner_name").notNull(),
    ownerUserId: text("owner_user_id"),
    ownerImage: text("owner_image").notNull().default(""),
    rating: integer("rating").notNull(),
    text: text("text").notNull(),
    location: text("location").notNull().default(""),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    responseText: text("response_text"),
    responseCreatedAt: text("response_created_at"),
  },
  (t) => [
    index("reviews_sitter_idx").on(t.sitterName),
    index("reviews_application_idx").on(t.applicationId),
  ],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    userName: text("user_name").notNull(),
    type: text("type").notNull(),
    actor: text("actor"),
    boatName: text("boat_name"),
    href: text("href").notNull(),
    readAt: text("read_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    index("notifications_user_id_idx").on(t.userId),
    index("notifications_user_name_idx").on(t.userName),
  ],
);

/** Per-user saved sit ids, archives, blocks, and reports. */
export const userSaved = sqliteTable(
  "user_saved",
  {
    userId: text("user_id").notNull(),
    sitId: text("sit_id").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("user_saved_user_idx").on(t.userId)],
);

export const userArchivedConversations = sqliteTable(
  "user_archived_conversations",
  {
    userId: text("user_id").notNull(),
    applicationId: text("application_id").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("user_archived_conversations_user_idx").on(t.userId)],
);

export const userArchivedSits = sqliteTable(
  "user_archived_sits",
  {
    userId: text("user_id").notNull(),
    sitId: text("sit_id").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("user_archived_sits_user_idx").on(t.userId)],
);

export const userBlocks = sqliteTable(
  "user_blocks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    blockedName: text("blocked_name").notNull(),
    blockedImage: text("blocked_image").notNull().default(""),
    blockedAt: text("blocked_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("user_blocks_user_idx").on(t.userId)],
);

export const userReports = sqliteTable(
  "user_reports",
  {
    id: text("id").primaryKey(),
    reporterUserId: text("reporter_user_id").notNull(),
    targetName: text("target_name").notNull(),
    reason: text("reason").notNull(),
    details: text("details").notNull().default(""),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    escalated: integer("escalated", { mode: "boolean" }).notNull().default(false),
    applicationId: text("application_id"),
    boatName: text("boat_name"),
    messageId: text("message_id"),
    messageText: text("message_text"),
    messageCreatedAt: text("message_created_at"),
  },
  (t) => [index("user_reports_reporter_idx").on(t.reporterUserId)],
);

// Re-export the Better Auth tables so the Drizzle client registers them.
export { account, session, user, verification } from "./auth-schema";

export type Vessel = typeof vessels.$inferSelect;
export type NewVessel = typeof vessels.$inferInsert;
export type Sit = typeof sits.$inferSelect;
export type NewSit = typeof sits.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type ApplicationMessage = typeof applicationMessages.$inferSelect;
export type SupportRequest = typeof supportRequests.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
