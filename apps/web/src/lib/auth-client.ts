import { createAuthClient } from "better-auth/react";

function normalizeOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/+$/, "");
}

// Always use same-origin `/api/*`. Vite (dev) and apps/web/server.ts (prod) proxy to the API.
// Direct cross-origin calls to the Cloud Run server break OAuth state cookies (state_mismatch).
const baseURL = undefined;

/** Direct API origin — only for WebSockets and other non-proxied backend connections. */
export const serverBaseURL: string | undefined = normalizeOrigin(import.meta.env.VITE_SERVER_URL);

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath;
}

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include",
    onError(e) {
      console.error("Auth client error:", e);
    },
  },
});
