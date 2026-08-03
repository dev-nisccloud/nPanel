import * as Sentry from "@sentry/react-router";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

const isProd = import.meta.env.PROD;

Sentry.init({
  dsn: "https://192682d4ad93a771a14c834658cc3c3c@o4511794820415488.ingest.us.sentry.io/4511845921980416",
  environment: import.meta.env.MODE,
  // Identity only — does NOT send API request/response bodies
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
  // Logs only in development — avoid production network/CPU overhead
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
