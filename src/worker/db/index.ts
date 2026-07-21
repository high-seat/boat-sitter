import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * Build a Drizzle client for the current request.
 *
 * IMPORTANT: Workers are stateless per request. Never hoist this into a
 * module-level singleton — construct it inside the handler each time.
 */
export function getDb(env: Env) {
  return drizzle(env.DB, { schema });
}

export type Db = ReturnType<typeof getDb>;
export { schema };
