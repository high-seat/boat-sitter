import type { Page } from "@playwright/test";

export const MAYA_OWNER = {
  name: "Maya & Finn",
  email: "maya.finn@boatstead.mock",
  image: "https://i.pravatar.cc/160?img=5",
  phoneNumber: "6912345678",
} as const;

type OwnerSeed = {
  name: string;
  email: string;
  image: string;
  phoneNumber: string;
  verified: boolean;
  emailConfirmed: boolean;
  role: "member" | "admin";
};

type SeedOwnerOptions = Partial<OwnerSeed> & {
  featureFlags?: Record<string, boolean>;
};

/**
 * Establish a real Better Auth session (via /api/dev/login) and local UI flags
 * before the app boots. Domain data comes from D1 — not localStorage.
 */
export async function seedOwnerSession(page: Page, options?: SeedOwnerOptions) {
  const { featureFlags, ...ownerOptions } = options ?? {};
  const owner: OwnerSeed = {
    ...MAYA_OWNER,
    verified: true,
    emailConfirmed: true,
    role: "member",
    ...ownerOptions,
  };
  const verificationKey = `harbourly-verification-${owner.name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")}`;
  const flagOverrides = {
    identityVerification: true,
    ...featureFlags,
  };

  const login = await page.request.post("/api/dev/login", {
    data: {
      email: owner.email,
      name: owner.name,
      image: owner.image,
    },
  });
  if (!login.ok()) {
    const body = await login.text();
    throw new Error(`Dev login failed (${login.status()}): ${body}`);
  }

  await page.request.put("/api/me/profile", {
    data: {
      phoneNumber: owner.phoneNumber,
      phoneCountryCode: "+30",
      location: "Lefkada, Greece",
      bio: "Owner of Solstice",
      image: owner.image,
    },
  });

  await page.addInitScript(
    ({ ownerState, verificationKey, flagOverrides }) => {
      localStorage.setItem("i18nextLng", "en-US");
      localStorage.setItem("harbourly-language", "en-US");
      if (ownerState.verified) {
        localStorage.setItem(
          verificationKey,
          JSON.stringify({
            status: "verified",
            provider: "harbourly-mock",
            verifiedAt: "2026-07-01T00:00:00.000Z",
            reference: "mock_e2e_verified",
          }),
        );
      } else {
        localStorage.removeItem(verificationKey);
      }
      localStorage.setItem(
        "boatstead-feature-flags",
        JSON.stringify({
          state: { overrides: flagOverrides },
          version: 1,
        }),
      );
      // emailConfirmed is still client-only in the SPA store for settings tests.
      (
        window as unknown as { __boatsteadE2e?: { emailConfirmed: boolean; role: string } }
      ).__boatsteadE2e = {
        emailConfirmed: ownerState.emailConfirmed,
        role: ownerState.role,
      };
    },
    { ownerState: owner, verificationKey, flagOverrides },
  );
}

export async function seedVerifiedOwner(page: Page) {
  await seedOwnerSession(page, { verified: true });
}

export async function seedUnverifiedOwner(page: Page) {
  await seedOwnerSession(page, { verified: false });
}
