import { useFeatureFlagStore } from "@/featureFlagStore";

export type FeatureFlagDefinition = {
  label: string;
  description: string;
  default: boolean;
};

export const FEATURE_FLAGS = {
  autoTranslateListings: {
    label: "Auto-translate listings",
    description: "Translate owner-written listing content into the viewer's language.",
    default: true,
  },
  identityVerification: {
    label: "Identity verification",
    description: "Show identity verification prompts and badges across the app.",
    default: true,
  },
} as const satisfies Record<string, FeatureFlagDefinition>;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export const FEATURE_FLAG_KEYS = Object.keys(FEATURE_FLAGS) as FeatureFlagKey[];

export function getFeatureFlag(key: FeatureFlagKey): boolean {
  const definition = FEATURE_FLAGS[key];
  if (!import.meta.env.DEV) return definition.default;
  const override = useFeatureFlagStore.getState().overrides[key];
  return override ?? definition.default;
}

export function useFeatureFlag(key: FeatureFlagKey): boolean {
  const override = useFeatureFlagStore((state) => state.overrides[key]);
  const definition = FEATURE_FLAGS[key];
  if (!import.meta.env.DEV) return definition.default;
  return override ?? definition.default;
}
