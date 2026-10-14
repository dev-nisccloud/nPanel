/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NPANEL_APP_URL?: string;
  readonly VITE_NPANEL_SERVER_URL?: string;
  /** Public URL for Nisc Cloud Docs (fumadocs). Used by the navbar Help link. */
  readonly VITE_DOCS_URL?: string;
  readonly VITE_HIVELOCITY_DEFAULT_HOSTNAME_DOMAIN?: string;
  /** When "true", every public route renders the coming soon page. */
  readonly VITE_IS_COMING_SOON?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
