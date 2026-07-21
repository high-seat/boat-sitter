/**
 * The canonical types now live where they're used:
 *   - Backend row + insert types:  src/worker/db/schema.ts
 *   - Joined listing (Boat):        src/worker/lib/join.ts
 *   - Frontend client + view types: src/react-app/mockApi.ts
 *
 * This file is kept only so older imports don't break. Prefer the modules above.
 */
export type { Boat } from "../worker/lib/join";
