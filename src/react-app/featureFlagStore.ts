import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  FEATURE_FLAG_KEYS,
  FEATURE_FLAGS,
  type FeatureFlagKey,
} from "@/featureFlags";

type FeatureFlagStore = {
  overrides: Partial<Record<FeatureFlagKey, boolean>>;
  setFlag: (key: FeatureFlagKey, enabled: boolean) => void;
  toggleFlag: (key: FeatureFlagKey) => void;
  resetFlags: () => void;
};

function defaultOverrides(): Partial<Record<FeatureFlagKey, boolean>> {
  return {};
}

export const useFeatureFlagStore = create<FeatureFlagStore>()(
  persist(
    (set, get) => ({
      overrides: defaultOverrides(),
      setFlag: (key, enabled) =>
        set((state) => ({
          overrides: {
            ...state.overrides,
            [key]: enabled,
          },
        })),
      toggleFlag: (key) => {
        const current =
          get().overrides[key] ?? FEATURE_FLAGS[key].default;
        set((state) => ({
          overrides: {
            ...state.overrides,
            [key]: !current,
          },
        }));
      },
      resetFlags: () => set({ overrides: defaultOverrides() }),
    }),
    {
      name: "boatstead-feature-flags",
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as FeatureFlagStore;
        const overrides = { ...defaultOverrides(), ...state.overrides };
        for (const key of FEATURE_FLAG_KEYS) {
          if (!(key in FEATURE_FLAGS)) {
            delete overrides[key];
          }
        }
        return { ...state, overrides };
      },
    },
  ),
);
