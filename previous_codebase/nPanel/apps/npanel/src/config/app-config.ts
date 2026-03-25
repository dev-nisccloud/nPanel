/**
 * App config used by root layout (metadata) and elsewhere.
 * Must never throw at module load: root layout is loaded for GET "/" and any throw = 500.
 */
const FALLBACK_CONFIG = {
  name: "Nisc Cloud - nPanel",
  version: "1.0.0",
  copyright: "© 2025, Nisc Cloud.",
  meta: { title: "Nisc Cloud", description: "Nisc Cloud" },
};

function buildAppConfig(): typeof FALLBACK_CONFIG {
  try {
    const version =
      typeof process.env.VITE_PUBLIC_APP_VERSION === "string" && process.env.VITE_PUBLIC_APP_VERSION
        ? process.env.VITE_PUBLIC_APP_VERSION
        : "1.0.0";
    const currentYear = new Date().getFullYear();
    return {
      name: "Nisc Cloud - nPanel",
      version,
      copyright: `© ${currentYear}, Nisc Cloud.`,
      meta: { title: "Nisc Cloud", description: "Nisc Cloud" },
    };
  } catch {
    return FALLBACK_CONFIG;
  }
}

export const APP_CONFIG = buildAppConfig();
