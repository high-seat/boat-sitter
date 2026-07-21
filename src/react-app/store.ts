import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MeasurementSystem = "metric" | "imperial";

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

export type UserProfile = {
  name: string;
  image: string;
  bio: string;
  location: string;
  languages: string[];
  preferredCountries: string[];
  skills: string[];
  preferredLanguage: string;
  measurementSystem: MeasurementSystem;
};

type AppStore = {
  saved: string[];
  user: UserProfile | null;
  toggleSaved: (id: string) => void;
  loginAs: (user: Pick<UserProfile, "name" | "image">) => void;
  updateProfile: (patch: Partial<Omit<UserProfile, "role">>) => void;
  deleteAccount: () => void;
  logout: () => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      saved: [],
      user: null,
      toggleSaved: (id) =>
        set((state) => ({
          saved: state.saved.includes(id)
            ? state.saved.filter((savedId) => savedId !== id)
            : [...state.saved, id],
        })),
      loginAs: (user) =>
        set({
          user: {
            ...user,
            bio: "Practical, calm and happiest near the water. I value transparent communication, careful preparation and thorough handovers.",
            location: "Brighton, United Kingdom",
            languages: ["English"],
            preferredCountries: [],
            skills: ["Detailed handovers", "Fast responder"],
            preferredLanguage: "en-US",
            measurementSystem: detectMeasurementSystem(),
          },
        }),
      updateProfile: (patch) =>
        set((state) => ({ user: state.user ? { ...state.user, ...patch } : null })),
      deleteAccount: () => set({ saved: [], user: null }),
      logout: () => set({ user: null }),
    }),
    {
      name: "harbourly",
      version: 3,
      migrate: (persistedState) => {
        const state = persistedState as AppStore;
        if (!state.user) return state;
        return {
          ...state,
          user: {
            ...state.user,
            preferredCountries: state.user.preferredCountries ?? [],
            preferredLanguage:
              state.user.preferredLanguage === "en" ? "en-US" : state.user.preferredLanguage,
            measurementSystem: state.user.measurementSystem ?? detectMeasurementSystem(),
          },
        };
      },
    },
  ),
);
