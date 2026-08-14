import type { SubscriptionRenewalRemindersPayload } from "../subscription-renewal-reminders";
export declare const SUBSCRIPTION_RENEWAL_REMINDERS_WORKER_PATH = "/api/workers/subscription-renewal-reminders";
/** Stable QStash schedule id so re-ensure upserts instead of duplicating. */
export declare const SUBSCRIPTION_RENEWAL_REMINDERS_SCHEDULE_ID = "npanel-subscription-renewal-reminders";
/** Daily at 00:00 UTC */
export declare const SUBSCRIPTION_RENEWAL_REMINDERS_CRON = "0 0 * * *";
/**
 * Resolve the public worker URL for renewal reminder jobs.
 * Prefers a dedicated env var; otherwise reuses the host from another QStash worker endpoint.
 */
export declare function getSubscriptionRenewalRemindersWorkerEndpoint(): string;
export declare function enqueueSubscriptionRenewalReminders(payload?: SubscriptionRenewalRemindersPayload): Promise<{
    messageId: string;
}>;
/**
 * Create or update the daily 00:00 UTC QStash schedule (idempotent via fixed scheduleId).
 */
export declare function ensureSubscriptionRenewalRemindersSchedule(): Promise<{
    scheduleId: string;
    destination: string;
} | null>;
export type RenewalReminderScheduleStatus = {
    configured: boolean;
    scheduleId: string;
    cron: string;
    destination: string | null;
    isPaused: boolean | null;
    scheduleExists: boolean;
    error: string | null;
};
/** Read current QStash schedule state for the renewal reminder cron. */
export declare function getSubscriptionRenewalRemindersScheduleStatus(): Promise<RenewalReminderScheduleStatus>;
