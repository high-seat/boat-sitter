import { invalidateApiSessionCache } from "@/apiRemote";
import { useAppStore } from "@/store";

/**
 * On app load, ask the Worker who the current session belongs to (/api/me) and,
 * if there is one, populate the store so the UI shows the user as logged in.
 *
 * This bridges the real Better Auth session to the existing store. It runs once
 * at startup; the Google button + callback set the session cookie, and this
 * reads it back on the next load.
 */
export async function hydrateSession(): Promise<void> {
  invalidateApiSessionCache();
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) return;
    const body = (await res.json()) as {
      user: { name: string; email: string; image?: string | null } | null;
      profile?: {
        name: string;
        email: string;
        emailConfirmed?: boolean;
        legalName: string;
        image: string;
        coverImage?: string;
        bio: string;
        location: string;
        languages: string[];
        preferredCountries: string[];
        skills: string[];
        preferredLanguage: string;
        measurementSystem: "metric" | "imperial";
        emailNotifications: Record<string, boolean>;
        sitDefaults: Record<string, unknown>;
        memberSince: number;
        phoneCountryCode: string;
        phoneNumber: string;
      } | null;
    };
    if (!body.user) return;

    const store = useAppStore.getState();
    store.loginAs({
      name: body.user.name,
      image:
        body.user.image ??
        `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(body.user.name)}`,
      email: body.user.email,
    });

    if (body.profile) {
      const profile = body.profile;
      // Apply without re-POSTing to the API (local merge only).
      useAppStore.setState((state) => ({
        user: state.user
          ? {
              ...state.user,
              email: profile.email,
              emailConfirmed: profile.emailConfirmed ?? true,
              name: profile.name,
              legalName: profile.legalName,
              image: profile.image,
              coverImage: profile.coverImage,
              bio: profile.bio,
              location: profile.location,
              languages: profile.languages,
              preferredCountries: profile.preferredCountries,
              skills: profile.skills,
              preferredLanguage: profile.preferredLanguage,
              measurementSystem: profile.measurementSystem,
              emailNotifications: {
                ...state.user.emailNotifications,
                ...profile.emailNotifications,
              },
              sitDefaults: {
                ...state.user.sitDefaults,
                ...(profile.sitDefaults as typeof state.user.sitDefaults),
              },
              memberSince: profile.memberSince,
              phoneCountryCode: profile.phoneCountryCode,
              phoneNumber: profile.phoneNumber,
            }
          : null,
      }));
    }

    try {
      const { apiGetPrefs } = await import("@/apiRemote");
      const prefs = await apiGetPrefs();
      useAppStore.getState().hydratePrefs({
        saved: prefs.saved,
        archivedConversations: prefs.archivedConversations,
        archivedSits: prefs.archivedSits,
        blockedUsers: prefs.blockedUsers,
        userReports: prefs.userReports.map((report) => ({
          ...report,
          reason: report.reason as
            | "spam"
            | "harassment"
            | "scam"
            | "inappropriate"
            | "other",
        })),
      });
    } catch {
      // Prefs table may not be migrated yet — keep local persist.
    }
  } catch {
    // Offline or auth not migrated — stay logged out.
  }
}
