/**
 * Browser cookie helpers for the React Router SPA.
 */
export function setClientCookie(
  key: string,
  value: string,
  options: { path?: string; maxAge?: number } = {},
): void {
  if (typeof document === "undefined") return;
  const path = options.path ?? "/";
  const maxAge = options.maxAge ?? 60 * 60 * 24 * 7;
  const encoded = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  document.cookie = `${encoded}; Path=${path}; Max-Age=${maxAge}; SameSite=Lax`;
}

export function getClientCookie(key: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${encodeURIComponent(key)}=([^;]*)`));
  return m?.[1] != null ? decodeURIComponent(m[1]) : undefined;
}
