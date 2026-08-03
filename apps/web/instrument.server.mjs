import * as Sentry from "@sentry/react-router";

const isProd = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://192682d4ad93a771a14c834658cc3c3c@o4511794820415488.ingest.us.sentry.io/4511845921980416",
  environment: process.env.NODE_ENV ?? "development",
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
  // Logs only in development
  enableLogs: !isProd,
  // Light tracing on the server shell (SPA — limited runtime impact for users)
  tracesSampleRate: isProd ? 0.05 : 1.0,
});
