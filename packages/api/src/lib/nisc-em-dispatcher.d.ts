type DispatchResult = {
    ran: false;
    reason: "LOCK_HELD";
} | {
    ran: true;
    claimed: number;
    sent: number;
    failed: number;
    throttled: number;
    elapsedMs: number;
};
export type NiscEmDispatchDebug = {
    startedAt: string;
    maxRuntimeMs: number;
    claimBatchSize: number;
    ratePerSecond: number;
    quota: {
        maxSendRate: number;
        max24HourSend: number;
        sentLast24HoursAtStart: number;
        reservedEmails: number;
        remainingEmails: number;
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
};
export declare function dispatchNiscEmEmailQueue(params?: {
    maxRuntimeMs?: number;
    claimBatchSize?: number;
}): Promise<DispatchResult>;
/**
 * Same dispatcher as {@link dispatchNiscEmEmailQueue} but returns extra diagnostics
 * that are useful to correlate with QStash job runs and Cloud Run logs.
 */
export declare function dispatchNiscEmEmailQueueWithDebug(params?: {
    maxRuntimeMs?: number;
    claimBatchSize?: number;
}): Promise<{
    result: DispatchResult;
    debug: NiscEmDispatchDebug;
}>;
export {};
