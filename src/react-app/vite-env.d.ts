/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GA4 Measurement ID (e.g. G-XXXXXXXXXX). Analytics is disabled if unset. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
