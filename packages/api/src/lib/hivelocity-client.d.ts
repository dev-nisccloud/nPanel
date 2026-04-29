type HivelocityRequestOptions = {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    query?: Record<string, string | number | boolean | null | undefined>;
    /** JSON request body (for POST/PUT). */
    body?: unknown;
    headers?: Record<string, string | undefined>;
    /** If true, throws when `HIVELOCITY_API_KEY` is missing. */
    requireApiKey?: boolean;
};
export declare function hivelocityRequest<T>(path: string, options?: HivelocityRequestOptions): Promise<T>;
export declare function getHivelocityEnvStatus(): {
    hasApiKey: boolean;
    baseUrl: string;
};
export {};
