import { create } from "zustand";
import { persist } from "zustand/middleware";
import { roleForEmail, type UserRole } from "@/adminAccess";
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  phoneCountryCodeFromLocation,
  resolvePhoneCountryCode,
} from "@/phoneCountryCode";
import { detectTimeFormat, type TimeFormat } from "../shared/timeFormat";

export type MeasurementSystem = "metric" | "imperial";
export type { TimeFormat };
export { detectTimeFormat };

export type EmailNotificationPrefs = {
  newApplications: boolean;
  applicationUpdates: boolean;
  messages: boolean;
  sitReminders: boolean;
  productUpdates: boolean;
};

export const DEFAULT_EMAIL_NOTIFICATIONS: EmailNotificationPrefs = {
  newApplications: true,
  applicationUpdates: true,
  messages: true,
  sitReminders: true,
  productUpdates: false,
};

export type ReportReason = "spam" | "harassment" | "scam" | "inappropriate" | "other";

export const REPORT_REASONS: ReportReason[] = [
  "spam",
  "harassment",
  "scam",
  "inappropriate",
  "other",
];

export type BlockedUser = {
  name: string;
  image: string;
  blockedAt: string;
};

export type UserReport = {
  id: string;
  targetName: string;
  reason: ReportReason;
  details: string;
  createdAt: string;
  escalated?: boolean;
  applicationId?: string;
  boatName?: string;
  messageId?: string;
  messageText?: string;
  messageCreatedAt?: string;
};

export function detectMeasurementSystem(): MeasurementSystem {
  if (typeof navigator === "undefined") return "metric";
  const locale = navigator.languages?.[0] ?? navigator.language;
  try {
    const region = new Intl.Locale(locale).maximize().region;
    return region && ["US", "LR", "MM"].includes(region) ? "imperial" : "metric";
  } catch {
    return "metric";
  }
}

function fallbackEmail(name: string) {
  const local = name
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, ".")
    .replaceAll(/^\.+|\.+$/g, "");
  return `${local || "member"}@boatstead.mock`;
}

async function withApiSession<T>(fn: () => Promise<T>): Promise<void> {
  const m = await import("@/apiRemote");
  if (!(await m.hasApiSession())) return;
  await fn();
}

export type SitCreationDefaults = {
  nonSmokerRequired: boolean;
};

export const DEFAULT_SIT_CREATION_DEFAULTS: SitCreationDefaults = {
  nonSmokerRequired: false,
};

export type ApplicationDefaults = {
  defaultPartySize: number;
};

export const DEFAULT_APPLICATION_DEFAULTS: ApplicationDefaults = {
  defaultPartySize: 1,
};

export type UserProfile = {
  email: string;
  emailConfirmed: boolean;
  name: string;
  legalName: string;
  image: string;
  coverImage?: string;
  bio: string;
  location: string;
  languages: string[];
  preferredCountries: string[];
  skills: string[];
  preferredLanguage: string;
  measurementSystem: MeasurementSystem;
  timeFormat: TimeFormat;
  emailNotifications: EmailNotificationPrefs;
  sitDefaults: SitCreationDefaults;
  applicationDefaults: ApplicationDefaults;
  memberSince: number;
  phoneCountryCode: string;
  phoneNumber: string;
  role: UserRole;
};

type AppStore = {
  saved: string[];
  archivedConversations: string[];
  deletedConversations: string[];
  blockedUsers: BlockedUser[];
  userReports: UserReport[];
  user: UserProfile | null;
  hydratePrefs: (prefs: {
    saved: string[];
    archivedConversations: string[];
    deletedConversations: string[];
    blockedUsers: BlockedUser[];
    userReports: UserReport[];
  }) => void;
  toggleSaved: (id: string) => void;
  archiveConversation: (id: string) => void;
  unarchiveConversation: (id: string) => void;
  isConversationArchived: (id: string) => boolean;
  deleteConversation: (id: string) => void;
  blockUser: (user: Pick<BlockedUser, "name" | "image">) => void;
  unblockUser: (name: string) => void;
  isUserBlocked: (name: string) => boolean;
  reportUser: (input: {
    targetName: string;
    reason: ReportReason;
    details: string;
    escalated?: boolean;
    applicationId?: string;
    boatName?: string;
    messageId?: string;
    messageText?: string;
    messageCreatedAt?: string;
  }) => void;
  loginAs: (
    user: Pick<UserProfile, "name" | "image"> & {
      email?: string;
      emailConfirmed?: boolean;
    },
    options?: { establishApiSession?: boolean },
  ) => void;
  updateProfile: (patch: Partial<Omit<UserProfile, "role">>) => void;
  deleteAccount: () => Promise<void>;
  logout: () => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      saved: [],
      archivedConversations: [],
      deletedConversations: [],
      blockedUsers: [],
      userReports: [],
      user: null,
      hydratePrefs: (prefs) =>
        set({
          saved: prefs.saved,
          archivedConversations: prefs.archivedConversations,
          deletedConversations: prefs.deletedConversations,
          blockedUsers: prefs.blockedUsers,
          userReports: prefs.userReports.map((report) => ({
            ...report,
            reason: report.reason as ReportReason,
          })),
        }),
      toggleSaved: (id) => {
        const currentlySaved = get().saved.includes(id);
        set((state) => ({
          saved: currentlySaved
            ? state.saved.filter((savedId) => savedId !== id)
            : [...state.saved, id],
        }));
        void withApiSession(async () => {
          const m = await import("@/apiRemote");
          await m.apiSetSaved(id, !currentlySaved);
        });
      },
      archiveConversation: (id) => {
        if (get().archivedConversations.includes(id)) return;
        if (get().deletedConversations.includes(id)) return;
        set((state) => ({
          archivedConversations: [...state.archivedConversations, id],
        }));
        void withApiSession(async () => {
          const m = await import("@/apiRemote");
          await m.apiSetArchivedConversation(id, true);
        });
      },
      unarchiveConversation: (id) => {
        set((state) => ({
          archivedConversations: state.archivedConversations.filter(
            (conversationId) => conversationId !== id,
          ),
        }));
        void withApiSession(async () => {
          const m = await import("@/apiRemote");
          await m.apiSetArchivedConversation(id, false);
        });
      },
      isConversationArchived: (id) => get().archivedConversations.includes(id),
      deleteConversation: (id) => {
        if (get().deletedConversations.includes(id)) return;
        set((state) => ({
          deletedConversations: [...state.deletedConversations, id],
          archivedConversations: state.archivedConversations.filter(
            (conversationId) => conversationId !== id,
          ),
        }));
        void withApiSession(async () => {
          const m = await import("@/apiRemote");
          await m.apiDeleteConversation(id);
        });
      },
      blockUser: (user) => {
        if (get().blockedUsers.some((blocked) => blocked.name === user.name)) return;
        set((state) => ({
          blockedUsers: [
            {
              name: user.name,
              image: user.image,
              blockedAt: new Date().toISOString(),
            },
            ...state.blockedUsers,
          ],
        }));
        void withApiSession(async () => {
          const m = await import("@/apiRemote");
          await m.apiBlockUser({ name: user.name, image: user.image });
        });
      },
      unblockUser: (name) => {
        set((state) => ({
          blockedUsers: state.blockedUsers.filter((blocked) => blocked.name !== name),
        }));
        void withApiSession(async () => {
          const m = await import("@/apiRemote");
          await m.apiUnblockUser(name);
        });
      },
      isUserBlocked: (name) => get().blockedUsers.some((blocked) => blocked.name === name),
      reportUser: ({
        targetName,
        reason,
        details,
        escalated,
        applicationId,
        boatName,
        messageId,
        messageText,
        messageCreatedAt,
      }) => {
        const localReport: UserReport = {
          id: `report-${Date.now()}`,
          targetName,
          reason,
          details: details.trim(),
          createdAt: new Date().toISOString(),
          escalated: escalated || undefined,
          applicationId,
          boatName,
          messageId,
          messageText,
          messageCreatedAt,
        };
        set((state) => ({
          userReports: [localReport, ...state.userReports],
        }));
        void withApiSession(async () => {
          const m = await import("@/apiRemote");
          const remote = await m.apiCreateUserReport({
            targetName,
            reason,
            details,
            escalated,
            applicationId,
            boatName,
            messageId,
            messageText,
            messageCreatedAt,
          });
          set((state) => ({
            userReports: state.userReports.map((report) =>
              report.id === localReport.id
                ? { ...report, id: remote.id, createdAt: remote.createdAt }
                : report,
            ),
          }));
        });
      },
      loginAs: (user, options) => {
        void import("@/apiRemote").then((m) => m.invalidateApiSessionCache());
        const email = user.email?.trim() || fallbackEmail(user.name);
        const location = "Brighton, United Kingdom";
        set({
          user: {
            ...user,
            email,
            emailConfirmed: user.emailConfirmed ?? true,
            legalName: user.name,
            bio: "Practical, calm and happiest near the water. I value transparent communication, careful preparation and thorough handovers.",
            location,
            languages: ["English"],
            preferredCountries: [],
            skills: ["Detailed handovers", "Fast responder"],
            preferredLanguage: "en-US",
            measurementSystem: detectMeasurementSystem(),
            timeFormat: detectTimeFormat(),
            emailNotifications: { ...DEFAULT_EMAIL_NOTIFICATIONS },
            sitDefaults: { ...DEFAULT_SIT_CREATION_DEFAULTS },
            applicationDefaults: { ...DEFAULT_APPLICATION_DEFAULTS },
            memberSince: 2024,
            phoneCountryCode: phoneCountryCodeFromLocation(location),
            phoneNumber: "",
            role: roleForEmail(email),
          },
        });
        if (import.meta.env.DEV && options?.establishApiSession !== false) {
          void (async () => {
            try {
              const res = await fetch("/api/dev/login", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email,
                  name: user.name,
                  image: user.image,
                }),
              });
              if (!res.ok) return;
              const { hydrateSession } = await import("@/session");
              await hydrateSession();
            } catch {
              // Keep optimistic local persona if DEV login is unavailable.
            }
          })();
        }
      },
      updateProfile: (patch) => {
        set((state) => ({ user: state.user ? { ...state.user, ...patch } : null }));
        void import("@/apiRemote").then(async (m) => {
          if (!(await m.hasApiSession())) return;
          await m.apiUpdateProfile(patch);
        });
      },
      deleteAccount: async () => {
        void import("@/apiRemote").then((m) => m.invalidateApiSessionCache());
        try {
          const m = await import("@/apiRemote");
          if (await m.hasApiSession()) {
            await m.apiDeleteAccount();
          }
        } catch {
          // Still clear local state even if remote delete fails.
        }
        void import("@/authClient").then((m) => m.signOut()).catch(() => {});
        set({
          saved: [],
          archivedConversations: [],
          deletedConversations: [],
          blockedUsers: [],
          userReports: [],
          user: null,
        });
      },
      logout: () => {
        // End the Better Auth session server-side too, so a reload doesn't
        // silently log the user back in from the session cookie.
        void import("@/apiRemote").then((m) => m.invalidateApiSessionCache());
        void import("@/authClient").then((m) => m.signOut()).catch(() => {});
        set({ user: null });
      },
    }),
    {
      name: "harbourly",
      version: 19,
      migrate: (persistedState) => {
        const state = persistedState as AppStore & { archivedSits?: string[] };
        const { archivedSits: _archivedSits, ...rest } = state;
        const next = {
          ...rest,
          archivedConversations: state.archivedConversations ?? [],
          deletedConversations: state.deletedConversations ?? [],
          blockedUsers: state.blockedUsers ?? [],
          userReports: state.userReports ?? [],
        };
        if (!next.user) return next;
        const email = next.user.email || fallbackEmail(next.user.name);
        const phoneNumber = next.user.phoneNumber ?? "";
        return {
          ...next,
          user: {
            ...next.user,
            email,
            emailConfirmed: next.user.emailConfirmed ?? true,
            legalName: next.user.legalName ?? next.user.name,
            coverImage: next.user.coverImage || undefined,
            preferredCountries: next.user.preferredCountries ?? [],
            preferredLanguage: (() => {
              const language = next.user.preferredLanguage;
              if (language === "en") return "en-US";
              if (language === "es") return "es-ES";
              if (language === "pt") return "pt-PT";
              return language;
            })(),
            measurementSystem: next.user.measurementSystem ?? detectMeasurementSystem(),
            timeFormat: next.user.timeFormat ?? detectTimeFormat(),
            emailNotifications: {
              ...DEFAULT_EMAIL_NOTIFICATIONS,
              ...next.user.emailNotifications,
            },
            sitDefaults: {
              ...DEFAULT_SIT_CREATION_DEFAULTS,
              ...next.user.sitDefaults,
            },
            applicationDefaults: {
              ...DEFAULT_APPLICATION_DEFAULTS,
              ...next.user.applicationDefaults,
            },
            memberSince: next.user.memberSince ?? 2024,
            phoneNumber,
            phoneCountryCode: resolvePhoneCountryCode({
              location: next.user.location ?? "",
              phoneCountryCode: next.user.phoneCountryCode ?? DEFAULT_PHONE_COUNTRY_CODE,
              phoneNumber,
            }),
            role: next.user.role ?? roleForEmail(email),
          },
        };
      },
    },
  ),
);
