import { createAuthClient } from "better-auth/react";

// VITE_SERVER_URL is baked in at build time from apps/web/.env.production.
// The Dockerfile writes this file from the --build-arg before running the build.
const _serverUrl = (import.meta.env.VITE_SERVER_URL as string | undefined) ?? "";
const baseURL = _serverUrl.startsWith("https://") ? _serverUrl : undefined;

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
