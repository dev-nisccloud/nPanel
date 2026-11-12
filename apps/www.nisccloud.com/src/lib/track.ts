import { track } from "@vercel/analytics";

type EventProperties = Record<string, string | number | boolean | null>;

/** Sends a custom event to the existing Vercel Analytics stack. Never pass personal contact data. */
export function trackEvent(name: string, properties?: EventProperties) {
  try {
    track(name, properties);
  } catch {
    // Analytics must never block navigation or form submission.
  }
}
