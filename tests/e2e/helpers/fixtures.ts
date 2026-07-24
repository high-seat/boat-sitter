import type { Page } from "@playwright/test";

export type DevFixtureKind =
  | "completed-sit"
  | "underway-sit"
  | "clear-underway-sit"
  | "paginated-applications"
  | "accept-solstice"
  | "reset-solstice-open"
  | "alex-blue-hour-accepted"
  | "lifecycle-sit"
  | "owner-second-boat"
  | "owner-boat-no-sits"
  | "unclaim-owned-vessels";

export type LifecycleSitPhase = "accepting" | "accepted" | "underway" | "completed";

/** Insert e2e fixtures that previously lived in harbourly-* localStorage keys. */
export async function seedDevFixture(
  page: Page,
  kind: DevFixtureKind,
  options?: { phase?: LifecycleSitPhase },
) {
  const res = await page.request.post("/api/dev/fixture", {
    data: { kind, ...(options?.phase ? { phase: options.phase } : {}) },
  });
  if (!res.ok()) {
    throw new Error(`Dev fixture ${kind} failed (${res.status()}): ${await res.text()}`);
  }
}

export async function seedLifecycleSit(page: Page, phase: LifecycleSitPhase) {
  await seedDevFixture(page, "lifecycle-sit", { phase });
}

export const LIFECYCLE_SIT_ID = "sit-lifecycle-e2e";
export const LIFECYCLE_APPLICATION_ID = "application-lifecycle-e2e";
