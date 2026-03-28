import { createAuthClient } from "better-auth/react";

// In dev, baseURL is undefined — Vite's proxy handles /api.
// In production, point directly at the API server.
const baseURL = import.meta.env.DEV
  ? undefined
  : "https://npanel-server-staging-961768926506.us-east1.run.app";

/** The resolved server origin (HTTPS only) — `undefined` in dev. */
export const serverBaseURL: string | undefined = baseURL;

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include",
    onError(e) {
      console.error("Auth client error:", e);
    },
  },
});
