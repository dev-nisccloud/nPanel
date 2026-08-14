import { getQStashClient } from "./client";
export const SUBSCRIPTION_RENEWAL_REMINDERS_WORKER_PATH = "/api/workers/subscription-renewal-reminders";
/** Stable QStash schedule id so re-ensure upserts instead of duplicating. */
export const SUBSCRIPTION_RENEWAL_REMINDERS_SCHEDULE_ID = "npanel-subscription-renewal-reminders";
/** Daily at 00:00 UTC */
export const SUBSCRIPTION_RENEWAL_REMINDERS_CRON = "0 0 * * *";
function isLoopbackUrl(url) {
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase();
        return (host === "localhost" ||
            host === "127.0.0.1" ||
            host === "::1" ||
            host === "[::1]");
    }
    catch {
        return false;
    }
}
/**
 * Resolve the public worker URL for renewal reminder jobs.
 * Prefers a dedicated env var; otherwise reuses the host from another QStash worker endpoint.
 */
export function getSubscriptionRenewalRemindersWorkerEndpoint() {
    const dedicated = process.env.QSTASH_SUBSCRIPTION_RENEWAL_REMINDERS_WORKER_ENDPOINT?.replace(/\/$/, "");
    if (dedicated)
        return dedicated;
    const peers = [
        process.env.QSTASH_NISC_ORDER_WORKER_ENDPOINT,
        process.env.QSTASH_SEO_SUITE_RANK_WORKER_ENDPOINT,
        process.env.QSTASH_ZEEPO_CANVAS_WORKER_ENDPOINT,
        process.env.QSTASH_META_ADS_ANALYSIS_WORKER_ENDPOINT,
    ];
    for (const peer of peers) {
        if (!peer)
            continue;
        try {
            const origin = new URL(peer).origin;
            return `${origin}${SUBSCRIPTION_RENEWAL_REMINDERS_WORKER_PATH}`;
        }
        catch {
            /* try next */
        }
    }
    const baseUrl = process.env.VITE_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
    if (baseUrl) {
        return (baseUrl.replace(/\/$/, "") + SUBSCRIPTION_RENEWAL_REMINDERS_WORKER_PATH);
    }
    return "";
}
export async function enqueueSubscriptionRenewalReminders(payload = {}) {
    const url = getSubscriptionRenewalRemindersWorkerEndpoint();
    if (!url) {
        throw new Error("Subscription renewal reminders worker URL not configured. Set QSTASH_SUBSCRIPTION_RENEWAL_REMINDERS_WORKER_ENDPOINT or another QSTASH_*_WORKER_ENDPOINT.");
    }
    if (isLoopbackUrl(url)) {
        throw new Error("QStash cannot call localhost. Set QSTASH_SUBSCRIPTION_RENEWAL_REMINDERS_WORKER_ENDPOINT to a public URL (e.g. ngrok).");
    }
    const client = getQStashClient();
    const result = await client.publishJSON({
        url,
        body: payload,
        retries: 2,
        timeout: 900,
    });
    return { messageId: result.messageId };
}
/**
 * Create or update the daily 00:00 UTC QStash schedule (idempotent via fixed scheduleId).
 */
export async function ensureSubscriptionRenewalRemindersSchedule() {
    const destination = getSubscriptionRenewalRemindersWorkerEndpoint();
    if (!destination || isLoopbackUrl(destination)) {
        console.warn("[subscription-renewal-reminders] Skipping schedule ensure: no public worker URL");
        return null;
    }
    if (!process.env.QSTASH_TOKEN) {
        console.warn("[subscription-renewal-reminders] Skipping schedule ensure: QSTASH_TOKEN missing");
        return null;
    }
    const client = getQStashClient();
    const result = await client.schedules.create({
        destination,
        cron: SUBSCRIPTION_RENEWAL_REMINDERS_CRON,
        scheduleId: SUBSCRIPTION_RENEWAL_REMINDERS_SCHEDULE_ID,
        body: JSON.stringify({
            source: "schedule",
            offset: 0,
        }),
        headers: {
            "Content-Type": "application/json",
        },
        retries: 2,
        timeout: 900,
    });
    console.log(`[subscription-renewal-reminders] Schedule ensured: ${result.scheduleId} → ${destination} (${SUBSCRIPTION_RENEWAL_REMINDERS_CRON})`);
    return { scheduleId: result.scheduleId, destination };
}
/** Read current QStash schedule state for the renewal reminder cron. */
export async function getSubscriptionRenewalRemindersScheduleStatus() {
    const destination = getSubscriptionRenewalRemindersWorkerEndpoint() || null;
    const base = {
        configured: Boolean(destination && process.env.QSTASH_TOKEN),
        scheduleId: SUBSCRIPTION_RENEWAL_REMINDERS_SCHEDULE_ID,
        cron: SUBSCRIPTION_RENEWAL_REMINDERS_CRON,
        destination,
        isPaused: null,
        scheduleExists: false,
        error: null,
    };
    if (!process.env.QSTASH_TOKEN) {
        return { ...base, error: "QSTASH_TOKEN not configured" };
    }
    try {
        const client = getQStashClient();
        const schedule = await client.schedules.get(SUBSCRIPTION_RENEWAL_REMINDERS_SCHEDULE_ID);
        return {
            ...base,
            configured: true,
            scheduleExists: true,
            destination: schedule.destination ?? destination,
            cron: schedule.cron ?? SUBSCRIPTION_RENEWAL_REMINDERS_CRON,
            isPaused: Boolean(schedule.isPaused ??
                schedule.paused),
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const notFound = message.toLowerCase().includes("not found") ||
            message.includes("404");
        return {
            ...base,
            scheduleExists: false,
            error: notFound ? null : message,
        };
    }
}
