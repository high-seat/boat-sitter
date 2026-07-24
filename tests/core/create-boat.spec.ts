import { expect, test } from "@playwright/test";

/**
 * CORE test — the test user can create a boat and delete it, run against the
 * DEPLOYED environment (staging + prod) after every deploy.
 *
 * This exercises the authenticated write path end to end: sign in → PUT a new
 * vessel → read it back → DELETE it → confirm it's gone. A green means the
 * session cookie authorizes writes, D1 accepts the insert, ownership checks
 * pass, and the delete path works. If the user can't create the boat, the
 * PUT assertion fails and so does the test.
 *
 * Uses the app's own API (not the multi-step editor UI) so it's stable on a
 * remote target. Credentials: TEST_USER_EMAIL / TEST_USER_PASSWORD.
 *
 * Cleanup: the vessel has NO attached sit, so it never enters the public
 * listing, and delete has no dependent rows to block it. An afterEach makes a
 * best-effort delete in case an assertion throws mid-test, so nothing leaks.
 */

const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

// Unique per run so parallel/retry runs never collide, and easy to spot/clean.
const boatId = `qatest-boat-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

let signedIn = false;

async function signIn(page: import("@playwright/test").Page): Promise<boolean> {
  const res = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password },
  });
  return res.ok();
}

test.afterEach(async ({ page }) => {
  // Best-effort teardown: if a mid-test assertion threw after create, remove it.
  if (signedIn) {
    await page.request.delete(`/api/vessels/${boatId}`).catch(() => {});
  }
});

test("core: test user can create and delete a boat", async ({ page }) => {
  test.skip(!process.env.CI && (!email || !password), "Set TEST_USER_EMAIL / TEST_USER_PASSWORD.");
  if (!email || !password) {
    throw new Error("TEST_USER_EMAIL / TEST_USER_PASSWORD must be set in CI for the core test.");
  }

  // Sign in (session cookie stored in this page's request context).
  signedIn = await signIn(page);
  expect(signedIn, "test user must be able to sign in").toBeTruthy();

  const body = {
    id: boatId,
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
  };

  // 1. Create — this is the assertion that fails if the user can't create it.
  const created = await page.request.put(`/api/vessels/${boatId}`, { data: body });
  expect(created.ok(), "boat creation (PUT /api/vessels) must succeed").toBeTruthy();
  const createdJson = (await created.json()) as { data?: { id?: string } };
  expect(createdJson.data?.id).toBe(boatId);

  // 2. Read it back — it really persisted.
  const fetched = await page.request.get(`/api/vessels/${boatId}`);
  expect(fetched.ok()).toBeTruthy();
  const fetchedJson = (await fetched.json()) as { data?: { id?: string } };
  expect(fetchedJson.data?.id).toBe(boatId);

  // 3. Delete it.
  const deleted = await page.request.delete(`/api/vessels/${boatId}`);
  expect(deleted.ok(), "boat deletion (DELETE /api/vessels) must succeed").toBeTruthy();
  const deletedJson = (await deleted.json()) as { data?: { deleted?: boolean } };
  expect(deletedJson.data?.deleted).toBe(true);

  // 4. Confirm it's gone.
  const gone = await page.request.get(`/api/vessels/${boatId}`);
  expect(gone.status()).toBe(404);
});
