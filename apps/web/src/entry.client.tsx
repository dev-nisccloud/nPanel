import * as Sentry from "@sentry/react-router";
import posthog from "posthog-js";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

const isProd = import.meta.env.PROD;
const posthogProjectToken = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

if (import.meta.env.DEV && !posthogProjectToken) {
  throw new Error(
    "VITE_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
  );
}

if (import.meta.env.DEV && !posthogHost) {
  throw new Error(
    "VITE_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_PUBLIC_POSTHOG_HOST is configured",
  );
}

if (posthogProjectToken && posthogHost) {
  posthog.init(posthogProjectToken, {
    api_host: posthogHost,
    defaults: "2026-01-30",
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
  });
}

Sentry.init({
  dsn: "https://192682d4ad93a771a14c834658cc3c3c@o4511794820415488.ingest.us.sentry.io/4511845921980416",
  environment: import.meta.env.MODE,
  // Identity only  does NOT send API request/response bodies
  sendDefaultPii: false,
  dataCollection: {
    userInfo: true,
    httpBodies: [],
    genAI: { inputs: false, outputs: false },
    cookies: false,
    urlQueryParams: false,
    stackFrameVariables: false,
  },
  integrations: [
    // Keep tracing in the critical path (lightweight)
    Sentry.reactRouterTracingIntegration(),
  ],
  // Logs only in development  avoid production network/CPU overhead
  enableLogs: !isProd,
  tracesSampleRate: isProd ? 0.05 : 1.0,
  tracePropagationTargets: [/^\//, /^https:\/\/.*\.nisccloud\.com/],
  // No continuous session recording; only capture a replay when an error occurs
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});

// Lazy-load Replay so it is not in the critical startup bundle
void import("@sentry/react-router").then((mod) => {
  Sentry.addIntegration(
    mod.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  );
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter
        instrumentations={[Sentry.createSentryClientInstrumentation()]}
        onError={Sentry.sentryOnError}
      />
    </StrictMode>,
  );
});
