/**
 * Encode/decode WordPress instance URLs on the customer side.
 * Uses an opaque slug (installationId + teamSlug) so the raw id is hidden and
 * we can validate that the viewer's team matches the slug, preventing access
 * to other teams' instances. No DB or secret required.
 */

const PAYLOAD_PREFIX = "wp";

/**
 * Encode installationId + teamSlug into a URL-safe slug for customer WordPress detail links.
 * Use this when building links on the customer side ([slug] routes).
 */
export function toWordPressDetailSlug(installationId: number, teamSlug: string): string {
  const payload = JSON.stringify({ i: installationId, t: teamSlug });
  const base64 = typeof Buffer !== "undefined"
    ? Buffer.from(payload, "utf8").toString("base64")
    : btoa(unescape(encodeURIComponent(payload)));
  const base64url = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${PAYLOAD_PREFIX}-${base64url}`;
}

/**
 * Decode a slug and validate team. Returns installationId only if the slug
 * is valid and teamSlug matches the current viewer's team.
 */
export function fromWordPressDetailSlug(slug: string, teamSlug: string): number | null {
  if (!slug.startsWith(`${PAYLOAD_PREFIX}-`)) return null;
  const base64url = slug.slice(PAYLOAD_PREFIX.length + 1);
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4 ? "=".repeat(4 - (base64.length % 4)) : "";
  let json: string;
  try {
    json =
      typeof Buffer !== "undefined"
        ? Buffer.from(base64 + padding, "base64").toString("utf8")
        : decodeURIComponent(escape(atob(base64 + padding)));
  } catch {
    return null;
  }
  let parsed: { i?: number; t?: string };
  try {
    parsed = JSON.parse(json) as { i?: number; t?: string };
  } catch {
    return null;
  }
  if (typeof parsed?.i !== "number" || parsed?.t !== teamSlug) return null;
  return parsed.i;
}

/**
 * Returns true if the string looks like our encoded slug (wp-...).
 * Use to decide whether to decode or treat as legacy numeric id.
 */
export function isWordPressDetailSlug(value: string): boolean {
  return value.startsWith(`${PAYLOAD_PREFIX}-`) && value.length > PAYLOAD_PREFIX.length + 1;
}
