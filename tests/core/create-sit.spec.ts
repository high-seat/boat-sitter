import { expect, test } from "@playwright/test";

/**
 * CORE test — the test user can create a sit (a listing period on a boat) and
 * delete it, run against the DEPLOYED environment (staging + prod).
 *
 * A sit hangs off a vessel, so the flow is: sign in → create a parent vessel →
 * PUT a new sit on it → confirm it's in the listing → DELETE the sit → DELETE
 * the vessel. If the user can't create the sit, the PUT assertion fails.
 *
 * The sit is created UNPUBLISHED on purpose: it never enters the public boats
 * listing and it skips the "notify matching sitters" fan-out, so the test has
 * no side effects on real users. Uses the API, not the editor UI, for
 * stability on a remote target. Credentials: TEST_USER_EMAIL / TEST_USER_PASSWORD.
 *
 * Cleanup: afterEach deletes the sit then the vessel (vessel delete is blocked
 * while a sit references it), best-effort, so a mid-test failure leaks nothing.
 */

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const vesselId = `qatest-boat-${stamp}`;
const sitId = `qatest-sit-${stamp}`;

let signedIn = false;

async function listContainsSit(
  page: import("@playwright/test").Page,
  id: string,
): Promise<boolean> {
  const res = await page.request.get("/api/sits");
  if (!res.ok()) return false;
  const body = (await res.json()) as { data?: Array<{ id?: string }> };
  return (body.data ?? []).some((s) => s.id === id);
}

test.afterEach(async ({ page }) => {
  // Best-effort teardown, sit before vessel (a vessel with sits can't delete).
  if (signedIn) {
    await page.request.delete(`/api/sits/${sitId}`).catch(() => {});
    await page.request.delete(`/api/vessels/${vesselId}`).catch(() => {});
  }
});

test("core: test user can create and delete a sit", async ({ page }) => {
  test.skip(!process.env.CI && (!email || !password), "Set TEST_USER_EMAIL / TEST_USER_PASSWORD.");
  if (!email || !password) {
    throw new Error("TEST_USER_EMAIL / TEST_USER_PASSWORD must be set in CI for the core test.");
  }

  const signin = await page.request.post("/api/auth/sign-in/email", { data: { email, password } });
  signedIn = signin.ok();
  expect(signedIn, "test user must be able to sign in").toBeTruthy();

  // Parent vessel (a sit must reference an owned vessel).
  const vessel = await page.request.put(`/api/vessels/${vesselId}`, {
    data: {
      id: vesselId,
      name: "QA Test Boat",
      type: "Sailboat",
      length: "10",
      yearBuilt: 2020,
      homePort: "Test Harbour",
      image: "https://example.com/qa-boat.jpg",
      gallery: [],
      owner: "QA Sitter",
      ownerImage: "https://example.com/qa-owner.jpg",
      rating: 0,
      reviews: 0,
      description: "Automated core-test boat. Safe to delete.",
      home: "Test Harbour, United Kingdom",
      systems: [],
      amenities: [],
    },
  });
  expect(vessel.ok(), "parent vessel must create").toBeTruthy();

  // 1. Create the sit — the assertion that fails if the user can't create it.
  //    Unpublished => no public listing, no match-notification fan-out.
  const created = await page.request.put(`/api/sits/${sitId}`, {
    data: {
      id: sitId,
      boatId: vesselId,
      dates: "1–7 Aug 2026",
      dateStart: "2026-08-01",
      duration: "1 week",
      location: "Test Harbour",
      country: "United Kingdom",
      responsibilities: ["General upkeep"],
      requirements: [],
      applicants: 0,
      featured: false,
      published: false,
      sitType: "liveaboard",
    },
  });
  expect(created.ok(), "sit creation (PUT /api/sits) must succeed").toBeTruthy();
  const createdJson = (await created.json()) as { data?: { id?: string; boatId?: string } };
  expect(createdJson.data?.id).toBe(sitId);
  expect(createdJson.data?.boatId).toBe(vesselId);

  // 2. It really persisted — present in the sits listing.
  expect(await listContainsSit(page, sitId)).toBeTruthy();

  // 3. Delete the sit.
  const deleted = await page.request.delete(`/api/sits/${sitId}`);
  expect(deleted.ok(), "sit deletion (DELETE /api/sits) must succeed").toBeTruthy();
  const deletedJson = (await deleted.json()) as { data?: { deleted?: boolean } };
  expect(deletedJson.data?.deleted).toBe(true);

  // 4. Gone from the listing.
  expect(await listContainsSit(page, sitId)).toBeFalsy();

  // 5. Now the vessel can be removed (no sit references it).
  const vesselGone = await page.request.delete(`/api/vessels/${vesselId}`);
  expect(vesselGone.ok(), "vessel deletion must succeed once its sit is gone").toBeTruthy();
});
