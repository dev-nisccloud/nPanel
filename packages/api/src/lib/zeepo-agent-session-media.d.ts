/** Walk JSON-ish payloads and collect absolute http(s) URL strings. */
export declare function collectHttpUrls(value: unknown, out?: Set<string>): Set<string>;
/**
 * Derive an object-storage key from a public URL when it lives on our bucket CDN.
 * Returns null for UploadThing / Replicate / unrelated hosts.
 */
export declare function objectKeyFromPublicUrl(url: string): string | null;
export declare function collectObjectKeysFromUrls(urls: Iterable<string>, extraKeys?: Iterable<string>): string[];
/**
 * Best-effort delete of object-storage keys. Failures are logged and ignored so
 * session DB deletion can still proceed.
 */
export declare function purgeObjectStorageKeys(keys: string[]): Promise<{
    deleted: number;
    failed: number;
}>;
