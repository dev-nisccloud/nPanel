/**
 * Public web app origin for links in emails and callbacks.
 * Uses VITE_PUBLIC_APP_URL (same as Vite client); on the server you can also set FRONTEND_URL as fallback.
 */
export function getNormalizedPublicAppUrl(): string {
	const raw = (process.env.VITE_PUBLIC_APP_URL ?? process.env.FRONTEND_URL ?? "").trim();
	if (!raw) return "";
	return raw.replace(/\/+$/, "");
}

/**
 * Append a path to the normalized public app URL. `path` must start with `/`.
 * Avoids double slashes when joining (e.g. base `https://x.com/` + path `/a` → `https://x.com/a`).
 */
export function joinPublicAppPath(path: string): string {
	const base = getNormalizedPublicAppUrl();
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	if (!base) return normalizedPath;
	return `${base}${normalizedPath}`;
}
