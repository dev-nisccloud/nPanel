import posthog from "posthog-js";

/**
 * Capture a PostHog event when the browser client is configured.
 * No-ops silently in production when env is missing; matches existing instrumentation pattern.
 */
export function captureEvent(
  event: string,
  properties?: Record<string, string | number | boolean | string[] | null | undefined>,
): void {
  if (
    !import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN ||
    !import.meta.env.VITE_PUBLIC_POSTHOG_HOST
  ) {
    return;
  }

  const cleaned: Record<string, string | number | boolean | string[]> = {};
  if (properties) {
    for (const [key, value] of Object.entries(properties)) {
      if (value === undefined || value === null) continue;
      cleaned[key] = value;
    }
  }

  posthog.capture(event, cleaned);
}

export function isPostHogConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN &&
      import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  );
}
