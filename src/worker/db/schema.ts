import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Boat listings.
 *
 * Note on modelling: `gallery`, `responsibilities`, `systems`, `requirements`
 * and `amenities` are stored as JSON text columns rather than normalised child
 * tables. That is a deliberate trade-off — this data is read-heavy, always
 * fetched as a whole listing, and never joined against. If you later need to
 * filter by a specific amenity at scale, promote `amenities` to its own table
 * with a join table; everything else can stay as JSON.
 */
export const boats = sqliteTable(
  "boats",
  {
    // Human-readable slug, e.g. "blue-hour"
    id: text("id").primaryKey(),

    name: text("name").notNull(),
    type: text("type").notNull(),
    length: text("length").notNull(),

    location: text("location").notNull(),
    country: text("country").notNull(),
    region: text("region").notNull(),

    // Display string, e.g. "12 Sep – 4 Oct"
    dates: text("dates").notNull(),
    // ISO date (YYYY-MM-DD) — the sortable/filterable one
    dateStart: text("date_start").notNull(),
    dateEnd: text("date_end"),
    // Display string, e.g. "22 nights"
    duration: text("duration").notNull(),
    nights: integer("nights"),

    image: text("image").notNull(),
    gallery: text("gallery", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),

    owner: text("owner").notNull(),
    ownerImage: text("owner_image"),

    rating: real("rating").notNull().default(0),
    reviews: integer("reviews").notNull().default(0),
    applicants: integer("applicants").notNull().default(0),

    description: text("description").notNull(),
    home: text("home"),

    responsibilities: text("responsibilities", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    systems: text("systems", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    requirements: text("requirements", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    amenities: text("amenities", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),

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
    index("boats_region_idx").on(t.region),
    index("boats_country_idx").on(t.country),
    index("boats_date_start_idx").on(t.dateStart),
    index("boats_featured_idx").on(t.featured),
    index("boats_published_idx").on(t.published),
  ],
);

export type Boat = typeof boats.$inferSelect;
export type NewBoat = typeof boats.$inferInsert;
