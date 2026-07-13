declare class LogBuffer {
    private buffer;
    private readonly maxBufferSize;
    private readonly maxRetainedLogs;
    private readonly flushInterval;
    private readonly minBackoffMs;
    private readonly maxBackoffMs;
    private intervalId;
    private isFlushing;
    private hasLoggedFlushFailure;
    private hasLoggedPoolDeferral;
    private backoffUntilMs;
    private backoffMs;
    private droppedCount;
    constructor();
    /**
     * Push a log entry to the buffer.
     */
    push(log: {
        path: string;
        type: string;
        userId?: string | null;
        teamId?: string | null;
        apiKeyId?: string | null;
        input: any;
        status: "SUCCESS" | "ERROR";
        errorCode?: string | null;
        durationMs: number;
        ipAddress?: string | null;
    }): void;
    private isInBackoff;
    /** True when a flush would compete with request traffic for pool slots. */
    private isPoolContended;
    private scheduleBackoff;
    private clearBackoff;
    /**
     * Cap memory use. Prefer retaining ERROR rows when trimming under pressure.
     */
    private enforceCap;
    /**
     * Periodically flushes buffered logs to the database.
     */
    private flush;
}
export declare const logBuffer: LogBuffer;
