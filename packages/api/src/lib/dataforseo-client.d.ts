export type DataForSEOUsageContext = {
    projectId?: string | null;
    teamId?: string | null;
    userId?: string | null;
    /** Called after a successful vendor response so callers can persist usage. */
    onUsage?: (info: {
        api: string;
        endpoint: string;
        units: number;
        costEstimate: number | null;
        meta?: Record<string, unknown>;
    }) => void | Promise<void>;
};
export declare function isDataForSeoConfigured(): boolean;
export declare function assertDataForSeoConfigured(): void;
export declare function dataForSeoRequest<T = unknown>(path: string, options?: {
    method?: "GET" | "POST";
    body?: unknown;
    usage?: DataForSEOUsageContext;
}): Promise<T>;
/** POST helper that returns the first task result array (or null). */
export declare function dataForSeoLiveResult<T = unknown>(path: string, tasks: unknown[], usage?: DataForSEOUsageContext): Promise<T[] | null>;
export declare function normalizeDomain(input: string): string;
