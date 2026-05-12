/**
 * Replicate-hosted artifact URLs must never be exposed to end users or stored as final outputs.
 * After UploadThing persistence, only durable ufs/uploadthing URLs should remain.
 */

export function isReplicateHostedMediaUrl(val: unknown): val is string {
	if (typeof val !== "string") return false;
	const u = val.trim();
	if (!u.startsWith("http")) return false;
	const lower = u.toLowerCase();
	return (
		lower.includes("replicate.delivery") ||
		lower.includes("replicate.com") ||
		lower.includes("replicate.cache") ||
		lower.includes("pbxt.replicate.delivery")
	);
}

/**
 * Deep-clone-ish transform: replace Replicate-hosted URL strings with null.
 * Use when returning generation payloads to clients (defense in depth).
 */
export function redactReplicateHostedUrlsDeep<T>(value: T): T {
	if (value == null) return value;
	if (typeof value === "string") {
		return (isReplicateHostedMediaUrl(value) ? null : value) as T;
	}
	if (Array.isArray(value)) {
		return value.map((item) => redactReplicateHostedUrlsDeep(item)) as T;
	}
	if (typeof value === "object") {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			out[k] = redactReplicateHostedUrlsDeep(v);
		}
		return out as T;
	}
	return value;
}
