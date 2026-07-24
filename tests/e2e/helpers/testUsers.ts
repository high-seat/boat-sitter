import type { Page } from "@playwright/test";

/**
 * Real Better Auth test users for e2e, matching the Cmd+K /api/dev/login tooling
 * (`dev-%@boatstead.test`). Prefer these over seed personas when a flow needs
 * clean ownership/application state.
 */

export const TEST_USER_AVATAR =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">' +
      '<rect width="160" height="160" rx="24" fill="#e11d48"/>' +
      '<text x="80" y="98" font-family="Helvetica,Arial,sans-serif" font-size="40" ' +
      'font-weight="bold" fill="#ffffff" text-anchor="middle">TEST</text></svg>',
  );

export type FreshTestUser = {
  id: string;
  email: string;
  name: string;
  image: string;
};

function freshIdentity(role: "owner" | "sitter"): Omit<FreshTestUser, "id"> {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const label = role === "owner" ? "Owner" : "Sitter";
  return {
    email: `dev-${role}-${suffix}@boatstead.test`,
    name: `Dev ${label} ${suffix.slice(-6)}`,
    image: TEST_USER_AVATAR,
  };
}

/** Sign in (or create) a tool test user and hydrate profile + verification flags. */
export async function loginFreshTestUser(
  page: Page,
  role: "owner" | "sitter" = "owner",
): Promise<FreshTestUser> {
  const identity = freshIdentity(role);
  const login = await page.request.post("/api/dev/login", {
    data: {
      email: identity.email,
      name: identity.name,
      image: identity.image,
    },
  });
  if (!login.ok()) {
    throw new Error(`Dev login failed (${login.status()}): ${await login.text()}`);
  }
  const body = (await login.json()) as { user?: { id?: string } };
  const id = body.user?.id;
  if (!id) throw new Error("Dev login returned no user id");

  await page.request.put("/api/me/profile", {
    data: {
      phoneNumber: role === "owner" ? "6912345678" : "6911112222",
      phoneCountryCode: "+30",
      location: "Lefkada, Greece",
      bio:
        role === "owner"
          ? "Automated e2e owner account."
          : "Automated e2e sitter account with published availability.",
      image: identity.image,
      yearsExperience: role === "sitter" ? 5 : 0,
    },
  });

  const verificationKey = `harbourly-verification-${identity.name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")}`;
  await page.addInitScript(
    ({ verificationKey, language }) => {
      localStorage.setItem("i18nextLng", language);
      localStorage.setItem("harbourly-language", language);
      localStorage.setItem(
        verificationKey,
        JSON.stringify({
          status: "verified",
          provider: "harbourly-mock",
          verifiedAt: "2026-07-01T00:00:00.000Z",
          reference: "mock_e2e_verified",
        }),
      );
    },
    { verificationKey, language: "en-US" },
  );

  return { ...identity, id };
}

export async function deleteFreshTestUser(page: Page, userId: string) {
  await page.request.delete(`/api/dev/test-users/${encodeURIComponent(userId)}`).catch(() => {});
}

export type InviteFixture = {
  owner: FreshTestUser;
  sitter: FreshTestUser;
  vesselId: string;
  sitId: string;
  boatName: string;
  dateStart: string;
  dateEnd: string;
};

/**
 * Owner with a published open sit + sitter with overlapping availability.
 * Leaves the page authenticated as the owner.
 */
export async function seedInviteFixture(page: Page): Promise<InviteFixture> {
  const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const vesselId = `dev-boat-${stamp}`;
  const sitId = `dev-sit-${stamp}`;
  const boatName = `Invite Test ${stamp.slice(-4)}`;
  const dateStart = "2026-09-01";
  const dateEnd = "2026-09-20";

  const sitter = await loginFreshTestUser(page, "sitter");
  const avail = await page.request.post("/api/availability", {
    data: {
      dateStart: "2026-08-25",
      dateEnd: "2026-09-30",
      regions: [],
      notes: "E2E availability for invite flow",
    },
  });
  if (!avail.ok()) {
    throw new Error(`Create availability failed (${avail.status()}): ${await avail.text()}`);
  }

  const owner = await loginFreshTestUser(page, "owner");
  const vessel = await page.request.put(`/api/vessels/${vesselId}`, {
    data: {
      id: vesselId,
      name: boatName,
      type: "Sailboat",
      length: "12",
      yearBuilt: 2018,
      homePort: "Lefkada, Greece",
      fullAddress: "Lefkas Marina, Lefkada 311 00, Greece",
      image:
        "https://images.pexels.com/photos/273886/pexels-photo-273886.jpeg?auto=compress&cs=tinysrgb&w=1400",
      gallery: [],
      owner: owner.name,
      ownerImage: owner.image,
      rating: 0,
      reviews: 0,
      description: "Automated invite-flow test boat.",
      home: "A practical layout for e2e sits.",
      systems: ["Shore power"],
      amenities: ["Wi-Fi"],
    },
  });
  if (!vessel.ok()) {
    throw new Error(`Create vessel failed (${vessel.status()}): ${await vessel.text()}`);
  }

  const sit = await page.request.put(`/api/sits/${sitId}`, {
    data: {
      id: sitId,
      boatId: vesselId,
      dates: "1–14 Sep 2026",
      dateStart,
      duration: "14 nights",
      location: "Lefkada",
      country: "Greece",
      responsibilities: ["General upkeep"],
      requirements: [],
      applicants: 0,
      featured: false,
      published: true,
      sitType: "liveaboard",
    },
  });
  if (!sit.ok()) {
    throw new Error(`Create sit failed (${sit.status()}): ${await sit.text()}`);
  }

  return { owner, sitter, vesselId, sitId, boatName, dateStart, dateEnd };
}

/** Switch the page session to an existing fresh test user. */
export async function loginAsFreshTestUser(page: Page, user: FreshTestUser) {
  const login = await page.request.post("/api/dev/login", {
    data: {
      email: user.email,
      name: user.name,
      image: user.image,
    },
  });
  if (!login.ok()) {
    throw new Error(`Dev login failed (${login.status()}): ${await login.text()}`);
  }
}
