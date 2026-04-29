type DispatchResult = {
    ran: false;
    reason: "LOCK_HELD";
} | {
    ran: true;
    claimed: number;
    sent: number;
    /** Rows we re-queued for a later retry (retryable SES errors). */
    requeued: number;
    /** Rows we marked FAILED permanently (non-retryable SES errors). */
    permanentlyFailed: number;
    /** Rows where SES threw a throttle-flavoured error, regardless of disposition. */
    throttled: number;
    elapsedMs: number;
    /**
     * True when the dispatcher stopped while there were still eligible emails
     * (either QUEUED or orphaned SENDING rows past the visibility timeout).
     * The caller should re-enqueue another dispatch to continue draining.
     */
    workRemaining: boolean;
    /** Count of eligible emails still pending at the end of the run. */
    remainingEligible: number;
};
export type NiscEmDispatchDebug = {
    startedAt: string;
    maxRuntimeMs: number;
    claimBatchSize: number;
    ratePerSecond: number;
    rateLimiterMode: "redis_global" | "local_fallback";
    lockHolder: string | null;
    quota: {
        maxSendRate: number;
        max24HourSend: number;
        sentLast24Hours: number;
    };
    queue: {
        eligibleQueuedCountAtStart: number;
        eligibleQueuedCountAtEnd: number;
        eligibleByStatusAtStart: Record<string, number>;
        eligibleByStatusAtEnd: Record<string, number>;
    };
    errors: {
        byMessage: Array<{
            message: string;
            count: number;
        }>;
    };
    warnings: string[];
};
export declare function dispatchNiscEmEmailQueueWithDebug(params?: {
    campaignId: string;
    maxRuntimeMs?: number;
    claimBatchSize?: number;
}): Promise<{
    result: DispatchResult;
    debug: NiscEmDispatchDebug;
}>;
export {};
