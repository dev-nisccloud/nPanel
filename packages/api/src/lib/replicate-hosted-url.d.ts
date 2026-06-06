/**
 * Replicate-hosted artifact URLs must never be exposed to end users or stored as final outputs.
 * After UploadThing persistence, only durable ufs/uploadthing URLs should remain.
 */
export declare function isReplicateHostedMediaUrl(val: unknown): val is string;
/**
 * Deep-clone-ish transform: replace Replicate-hosted URL strings with null.
 * Use when returning generation payloads to clients (defense in depth).
 */
export declare function redactReplicateHostedUrlsDeep<T>(value: T): T;
