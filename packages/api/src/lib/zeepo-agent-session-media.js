import { deleteObject, getObjectStorageConfig, isObjectStorageConfigured, } from "./object-storage";
/** Walk JSON-ish payloads and collect absolute http(s) URL strings. */
export function collectHttpUrls(value, out = new Set()) {
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (/^https?:\/\//i.test(trimmed))
            out.add(trimmed);
        return out;
    }
    if (Array.isArray(value)) {
        for (const item of value)
            collectHttpUrls(item, out);
        return out;
    }
    if (value && typeof value === "object") {
        for (const item of Object.values(value)) {
            collectHttpUrls(item, out);
        }
    }
    return out;
}
/**
 * Derive an object-storage key from a public URL when it lives on our bucket CDN.
 * Returns null for UploadThing / Replicate / unrelated hosts.
 */
export function objectKeyFromPublicUrl(url) {
    if (!isObjectStorageConfigured())
        return null;
    let parsed;
    try {
        parsed = new URL(url.trim());
    }
    catch {
        return null;
    }
    const { publicBaseUrl, bucket, endpoint } = getObjectStorageConfig();
    const pathname = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    const base = publicBaseUrl.replace(/\/$/, "");
    if (url.trim().startsWith(`${base}/`)) {
        const key = url.trim().slice(base.length + 1).split(/[?#]/)[0] ?? "";
        return key || null;
    }
    // Path-style endpoint: {endpoint}/{bucket}/{key}
    try {
        const endpointHost = new URL(endpoint).host;
        if (parsed.host === endpointHost) {
            const prefix = `${bucket}/`;
            if (pathname.startsWith(prefix)) {
                return pathname.slice(prefix.length) || null;
            }
        }
    }
    catch {
        // ignore
    }
    // Known durable hosts where path is the key (storage.nisccloud.com/key…)
    if (/storage\.nisccloud\.com$/i.test(parsed.host) || /npanel-uploads/i.test(parsed.host)) {
        return pathname || null;
    }
    return null;
}
export function collectObjectKeysFromUrls(urls, extraKeys = []) {
    const keys = new Set();
    for (const key of extraKeys) {
        const k = key.trim();
        if (k)
            keys.add(k);
    }
    for (const url of urls) {
        const key = objectKeyFromPublicUrl(url);
        if (key)
            keys.add(key);
    }
    return [...keys];
}
/**
 * Best-effort delete of object-storage keys. Failures are logged and ignored so
 * session DB deletion can still proceed.
 */
export async function purgeObjectStorageKeys(keys) {
    if (keys.length === 0 || !isObjectStorageConfigured()) {
        return { deleted: 0, failed: 0 };
    }
    let deleted = 0;
    let failed = 0;
    await Promise.all(keys.map(async (key) => {
        try {
            await deleteObject(key);
            deleted += 1;
        }
        catch (error) {
            failed += 1;
            console.error("[zeepo-agent] Failed to delete object storage key:", key, error);
        }
    }));
    return { deleted, failed };
}
