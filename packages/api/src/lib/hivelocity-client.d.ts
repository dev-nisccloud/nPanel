type HivelocityRequestOptions = {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    query?: Record<string, string | number | boolean | null | undefined>;
    /** JSON request body (for POST/PUT). */
    body?: unknown;
    headers?: Record<string, string | undefined>;
    /** If true, throws when `HIVELOCITY_API_KEY` is missing. */
    requireApiKey?: boolean;
};
export type HivelocityRequestTiming = {
    path: string;
    method: string;
    durationMs: number;
    responseBytes: number;
    status: number;
};
export declare function logHivelocityRequestTiming(timing: HivelocityRequestTiming): void;
/** Like `hivelocityRequest` but also returns per-call timing for diagnostics. */
export declare function hivelocityRequestTimed<T>(path: string, options?: HivelocityRequestOptions): Promise<{
    data: T;
    timing: HivelocityRequestTiming;
}>;
export declare function hivelocityRequest<T>(path: string, options?: HivelocityRequestOptions): Promise<T>;
export declare function getHivelocityEnvStatus(): {
    hasApiKey: boolean;
    hasBillingInfoId: boolean;
    baseUrl: string;
};
export {};
