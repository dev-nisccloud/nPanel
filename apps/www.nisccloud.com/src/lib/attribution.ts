const STORAGE_KEY = "nisc_attribution";
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export type Attribution = Partial<Record<(typeof UTM_KEYS)[number], string>> & {
  landing_page?: string;
};

/** Stores first-touch campaign parameters for the browser session. */
export function rememberAttribution() {
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const attribution: Attribution = { landing_page: window.location.pathname };
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) attribution[key] = value.slice(0, 120);
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Storage can be unavailable in private browsing.
  }
}

export function getAttribution(): Attribution {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Attribution) : {};
  } catch {
    return {};
  }
}
