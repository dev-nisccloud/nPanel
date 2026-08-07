export type SeoSuiteRankJobPayload = {
    trackerId: string;
    projectId: string;
    userId?: string;
};
export type SeoSuiteAuditJobPayload = {
    auditRunId: string;
    projectId: string;
    userId?: string;
};
/**
 * Enqueue rank check via QStash when a public worker URL is configured.
 * Returns `{ queued: false }` so callers can run inline (local/dev).
 */
export declare function enqueueSeoSuiteRankJob(payload: SeoSuiteRankJobPayload): Promise<{
    queued: boolean;
    messageId?: string;
}>;
export declare function enqueueSeoSuiteAuditJob(payload: SeoSuiteAuditJobPayload): Promise<{
    queued: boolean;
    messageId?: string;
}>;
