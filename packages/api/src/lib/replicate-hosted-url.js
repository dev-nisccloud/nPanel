/**
 * Replicate-hosted artifact URLs must never be exposed to end users or stored as final outputs.
 * After UploadThing persistence, only durable ufs/uploadthing URLs should remain.
 */
export function isReplicateHostedMediaUrl(val) {
    if (typeof val !== "string")
        return false;
    const u = val.trim();
    if (!u.startsWith("http"))
        return false;
    const lower = u.toLowerCase();
    return (lower.includes("replicate.delivery") ||
        lower.includes("replicate.com") ||
        lower.includes("replicate.cache") ||
        lower.includes("pbxt.replicate.delivery"));
}
/**
 * Deep-clone-ish transform: replace Replicate-hosted URL strings with null.
 * Use when returning generation payloads to clients (defense in depth).
 */
export function redactReplicateHostedUrlsDeep(value) {
    if (value == null)
        return value;
    if (typeof value === "string") {
        return (isReplicateHostedMediaUrl(value) ? null : value);
    }
    if (Array.isArray(value)) {
        return value.map((item) => redactReplicateHostedUrlsDeep(item));
    }
    if (typeof value === "object") {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            out[k] = redactReplicateHostedUrlsDeep(v);
        }
        return out;
    }
    return value;
}
