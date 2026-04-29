/**
 * Buffered batch logger for API requests to minimize DB overhead.
 */
declare class LogBuffer {
    private buffer;
    private readonly maxBufferSize;
    private readonly maxRetainedLogs;
    private readonly flushInterval;
    private intervalId;
    private isFlushing;
    private hasLoggedFlushFailure;
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
    /**
     * Periodically flushes buffered logs to the database.
     */
    private flush;
}
export declare const logBuffer: LogBuffer;
export {};
