/** Subscriptions with expiry (or next renewal) on/before this many days from now are reminded. */
export declare const RENEWAL_REMINDER_WINDOW_DAYS = 7;
/** Skip re-sending if a cron/manual reminder was sent within this window. */
export declare const RENEWAL_REMINDER_DEDUPE_HOURS = 23;
/** Treat RUNNING runs with no heartbeat older than this as stale. */
export declare const RENEWAL_REMINDER_STALE_MS: number;
export declare const SUBSCRIPTION_RENEWAL_REMINDERS_JOB_KEY: "subscription-renewal-reminders";
export type SubscriptionRenewalRemindersPayload = {
    offset?: number;
    limit?: number;
    /** Agency user who clicked "Run now"; cron omits this. */
    triggeredByUserId?: string | null;
    source?: "schedule" | "manual" | "continuation";
    /** Existing run id when continuing a batch or resuming after queue. */
    runId?: string;
};
export type SubscriptionRenewalRemindersResult = {
    runId: string;
    scanned: number;
    sent: number;
    skipped: number;
    failed: number;
    errors: {
        subscriptionId: string;
        error: string;
    }[];
    hasMore: boolean;
    nextOffset: number;
    status: string;
};
export declare function findActiveRenewalReminderRun(): Promise<{
    id: string;
    status: string;
    heartbeatAt: Date | null;
    startedAt: Date | null;
    isStale: boolean;
} | null>;
/**
 * Create a new run row (queued). Used before enqueueing to QStash.
 */
export declare function createRenewalReminderRun(opts: {
    source: "schedule" | "manual";
    triggeredByUserId?: string | null;
    qstashMessageId?: string | null;
}): Promise<string>;
/**
 * Scan client subscriptions that are expired or due within {@link RENEWAL_REMINDER_WINDOW_DAYS}
 * and send renewal reminder emails to team billing addresses.
 * Persists run + per-subscription item logs.
 */
export declare function processSubscriptionRenewalReminders(opts?: SubscriptionRenewalRemindersPayload): Promise<SubscriptionRenewalRemindersResult>;
export declare function markRenewalReminderContinuationFailed(runId: string, error: string): Promise<void>;
export declare function attachQstashMessageId(runId: string, messageId: string): Promise<void>;
