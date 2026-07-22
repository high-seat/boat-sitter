import { create } from "zustand";
import { persist } from "zustand/middleware";
import { roleForEmail, type UserRole } from "@/adminAccess";

export type MeasurementSystem = "metric" | "imperial";

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

export type SitCreationDefaults = {
  nonSmokerRequired: boolean;
};

export const DEFAULT_SIT_CREATION_DEFAULTS: SitCreationDefaults = {
  nonSmokerRequired: false,
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
  emailNotifications: EmailNotificationPrefs;
  sitDefaults: SitCreationDefaults;
  memberSince: number;
  phoneCountryCode: string;
  phoneNumber: string;
  role: UserRole;
};

type AppStore = {
  saved: string[];
  archivedConversations: string[];
  archivedSits: string[];
  blockedUsers: BlockedUser[];
  userReports: UserReport[];
  user: UserProfile | null;
  toggleSaved: (id: string) => void;
  archiveConversation: (id: string) => void;
  unarchiveConversation: (id: string) => void;
  isConversationArchived: (id: string) => boolean;
  archiveSit: (id: string) => void;
  unarchiveSit: (id: string) => void;
  isSitArchived: (id: string) => boolean;
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
  ) => void;
  updateProfile: (patch: Partial<Omit<UserProfile, "role">>) => void;
  deleteAccount: () => void;
  logout: () => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      saved: [],
      archivedConversations: [],
      archivedSits: [],
      blockedUsers: [],
      userReports: [],
      user: null,
      toggleSaved: (id) =>
        set((state) => ({
          saved: state.saved.includes(id)
            ? state.saved.filter((savedId) => savedId !== id)
            : [...state.saved, id],
        })),
      archiveConversation: (id) =>
        set((state) =>
          state.archivedConversations.includes(id)
            ? state
            : { archivedConversations: [...state.archivedConversations, id] },
        ),
      unarchiveConversation: (id) =>
        set((state) => ({
          archivedConversations: state.archivedConversations.filter(
            (conversationId) => conversationId !== id,
          ),
        })),
      isConversationArchived: (id) => get().archivedConversations.includes(id),
      archiveSit: (id) =>
        set((state) =>
          state.archivedSits.includes(id) ? state : { archivedSits: [...state.archivedSits, id] },
        ),
      unarchiveSit: (id) =>
        set((state) => ({
          archivedSits: state.archivedSits.filter((sitId) => sitId !== id),
        })),
      isSitArchived: (id) => get().archivedSits.includes(id),
      blockUser: (user) =>
        set((state) => {
          if (state.blockedUsers.some((blocked) => blocked.name === user.name)) {
            return state;
          }
          return {
            blockedUsers: [
              {
                name: user.name,
                image: user.image,
                blockedAt: new Date().toISOString(),
              },
              ...state.blockedUsers,
            ],
          };
        }),
      unblockUser: (name) =>
        set((state) => ({
          blockedUsers: state.blockedUsers.filter((blocked) => blocked.name !== name),
        })),
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
      }) =>
        set((state) => ({
          userReports: [
            {
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
            },
            ...state.userReports,
          ],
        })),
      loginAs: (user) => {
        const email = user.email?.trim() || fallbackEmail(user.name);
        set({
          user: {
            ...user,
            email,
            emailConfirmed: user.emailConfirmed ?? true,
            legalName: user.name,
            bio: "Practical, calm and happiest near the water. I value transparent communication, careful preparation and thorough handovers.",
            location: "Brighton, United Kingdom",
            languages: ["English"],
            preferredCountries: [],
            skills: ["Detailed handovers", "Fast responder"],
            preferredLanguage: "en-US",
            measurementSystem: detectMeasurementSystem(),
            emailNotifications: { ...DEFAULT_EMAIL_NOTIFICATIONS },
            sitDefaults: { ...DEFAULT_SIT_CREATION_DEFAULTS },
            memberSince: 2024,
            phoneCountryCode: "+1",
            phoneNumber: "",
            role: roleForEmail(email),
          },
        });
      },
      updateProfile: (patch) =>
        set((state) => ({ user: state.user ? { ...state.user, ...patch } : null })),
      deleteAccount: () =>
        set({
          saved: [],
          archivedConversations: [],
          archivedSits: [],
          blockedUsers: [],
          userReports: [],
          user: null,
        }),
      logout: () => {
        // End the Better Auth session server-side too, so a reload doesn't
        // silently log the user back in from the session cookie.
        void import("@/authClient").then((m) => m.signOut()).catch(() => {});
        set({ user: null });
      },
    }),
    {
      name: "harbourly",
      version: 15,
      migrate: (persistedState) => {
        const state = persistedState as AppStore;
        const next = {
          ...state,
          archivedConversations: state.archivedConversations ?? [],
          archivedSits: state.archivedSits ?? [],
          blockedUsers: state.blockedUsers ?? [],
          userReports: state.userReports ?? [],
        };
        if (!next.user) return next;
        const email = next.user.email || fallbackEmail(next.user.name);
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
            emailNotifications: {
              ...DEFAULT_EMAIL_NOTIFICATIONS,
              ...next.user.emailNotifications,
            },
            sitDefaults: {
              ...DEFAULT_SIT_CREATION_DEFAULTS,
              ...next.user.sitDefaults,
            },
            memberSince: next.user.memberSince ?? 2024,
            phoneCountryCode: next.user.phoneCountryCode ?? "+1",
            phoneNumber: next.user.phoneNumber ?? "",
            role: next.user.role ?? roleForEmail(email),
          },
        };
      },
    },
  ),
);
