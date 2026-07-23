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

/** Seeds a logged-in owner session before the app boots. */
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

  await page.addInitScript(
    ({ ownerState, verificationKey, flagOverrides }) => {
      localStorage.clear();
      localStorage.setItem("i18nextLng", "en-US");
      localStorage.setItem(
        "harbourly",
        JSON.stringify({
          state: {
            saved: [],
            archivedConversations: [],
            archivedSits: [],
            blockedUsers: [],
            userReports: [],
            user: {
              name: ownerState.name,
              email: ownerState.email,
              emailConfirmed: ownerState.emailConfirmed,
              legalName: ownerState.name,
              image: ownerState.image,
              bio: "Owner of Solstice",
              location: "Lefkada, Greece",
              languages: ["English"],
              preferredCountries: ["Greece"],
              skills: [],
              preferredLanguage: "en-US",
              measurementSystem: "metric",
              emailNotifications: {
                newApplications: true,
                applicationUpdates: true,
                messages: true,
                sitReminders: true,
                productUpdates: false,
              },
              sitDefaults: { nonSmokerRequired: false },
              memberSince: 2021,
              phoneCountryCode: "+30",
              phoneNumber: ownerState.phoneNumber,
              role: ownerState.role,
            },
          },
          version: 16,
        }),
      );
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
      }
      localStorage.setItem(
        "boatstead-feature-flags",
        JSON.stringify({
          state: { overrides: flagOverrides },
          version: 1,
        }),
      );
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
