import { createAuthClient } from "better-auth/react";

// __NPANEL_SERVER_URL__ is injected by vite.config.ts `define` at build time.
// It reads from loadEnv (which covers .env files) AND process.env (which covers
// Docker ENV / CI build args). This is more reliable than import.meta.env which
// was silently empty in production builds.
declare const __NPANEL_SERVER_URL__: string;
const _serverUrl: string = typeof __NPANEL_SERVER_URL__ !== "undefined" ? __NPANEL_SERVER_URL__ : "";
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
