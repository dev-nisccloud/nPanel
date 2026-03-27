import { createAuthClient } from "better-auth/react";

// In production the web SPA (npanel-web) lives on a different Cloud Run origin from
// the API server (npanel-server), so we point the auth client directly at the server.
// In dev/ngrok, VITE_SERVER_URL is an http://localhost URL that the browser can't reach
// cross-origin — Vite's dev-server proxy handles /api transparently, so no baseURL
// is needed. We detect production by checking for an HTTPS scheme.
const _rawServerUrl = import.meta.env.VITE_SERVER_URL as string | undefined;
const baseURL = _rawServerUrl?.startsWith("https://") ? _rawServerUrl : undefined;

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include",
    onError(e) {
      console.error("Auth client error:", e);
    },
  },
});
