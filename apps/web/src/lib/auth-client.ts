import { createAuthClient } from "better-auth/react";

function normalizeOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/+$/, "");
}

// In dev, baseURL is undefined — Vite's proxy handles /api.
// In production, use the build-time API origin injected via VITE_SERVER_URL.
const baseURL = import.meta.env.DEV
  ? undefined
  : normalizeOrigin(import.meta.env.VITE_SERVER_URL);

if (import.meta.env.PROD && !baseURL) {
  console.error(
    "[auth-client] Missing VITE_SERVER_URL at build time. Set --build-arg VITE_SERVER_URL=<api-origin> in the web image build.",
  );
}

/** The resolved server origin (HTTPS only) — `undefined` in dev. */
export const serverBaseURL: string | undefined = baseURL;

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return serverBaseURL ? `${serverBaseURL}${normalizedPath}` : normalizedPath;
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
