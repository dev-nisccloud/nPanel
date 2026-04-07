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
export declare function dispatchNiscEmEmailQueue(params?: {
    maxRuntimeMs?: number;
    claimBatchSize?: number;
}): Promise<DispatchResult>;
export {};
