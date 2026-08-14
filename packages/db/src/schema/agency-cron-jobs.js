import { relations } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { niscClientSubscription } from "./products";
/**
 * Agency scheduled / manual cron job runs (e.g. subscription renewal reminders).
 * One row spans the full logical run (including QStash batch continuations).
 */
export const agencyCronJobRun = pgTable("agency_cron_job_run", {
    id: text("id").primaryKey(),
    /** e.g. subscription-renewal-reminders */
    jobKey: text("job_key").notNull(),
    /** schedule | manual */
    source: text("source").notNull(),
    /** queued | running | completed | partial | failed */
    status: text("status").notNull().default("queued"),
    triggeredByUserId: text("triggered_by_user_id").references(() => user.id, {
        onDelete: "set null",
    }),
    qstashMessageId: text("qstash_message_id"),
    scanned: integer("scanned").notNull().default(0),
    sent: integer("sent").notNull().default(0),
    skipped: integer("skipped").notNull().default(0),
    failed: integer("failed").notNull().default(0),
    currentOffset: integer("current_offset").notNull().default(0),
    batchCount: integer("batch_count").notNull().default(0),
    lastError: text("last_error"),
    summary: text("summary"),
    metadata: jsonb("metadata").$type(),
    startedAt: timestamp("started_at"),
    finishedAt: timestamp("finished_at"),
    /** Heartbeat while RUNNING so stale runs can be detected. */
    heartbeatAt: timestamp("heartbeat_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    index("agency_cron_job_run_jobKey_idx").on(table.jobKey),
    index("agency_cron_job_run_status_idx").on(table.status),
    index("agency_cron_job_run_createdAt_idx").on(table.createdAt),
    index("agency_cron_job_run_jobKey_status_idx").on(table.jobKey, table.status),
    index("agency_cron_job_run_triggeredByUserId_idx").on(table.triggeredByUserId),
]);
/**
 * Per-subscription outcome within a cron run (sent / skipped / failed).
 */
export const agencyCronJobRunItem = pgTable("agency_cron_job_run_item", {
    id: text("id").primaryKey(),
    runId: text("run_id")
        .notNull()
        .references(() => agencyCronJobRun.id, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id").references(() => niscClientSubscription.id, { onDelete: "set null" }),
    /** sent | skipped | failed */
    outcome: text("outcome").notNull(),
    /** no_billing_email | recently_reminded | no_due_date | … */
    skipReason: text("skip_reason"),
    emailTo: text("email_to"),
    subject: text("subject"),
    error: text("error"),
    subscriptionName: text("subscription_name"),
    productName: text("product_name"),
    expiryDate: timestamp("expiry_date"),
    metadata: jsonb("metadata").$type(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("agency_cron_job_run_item_runId_idx").on(table.runId),
    index("agency_cron_job_run_item_subscriptionId_idx").on(table.subscriptionId),
    index("agency_cron_job_run_item_outcome_idx").on(table.outcome),
    index("agency_cron_job_run_item_createdAt_idx").on(table.createdAt),
]);
export const agencyCronJobRunRelations = relations(agencyCronJobRun, ({ one, many }) => ({
    triggeredBy: one(user, {
        fields: [agencyCronJobRun.triggeredByUserId],
        references: [user.id],
    }),
    items: many(agencyCronJobRunItem),
}));
export const agencyCronJobRunItemRelations = relations(agencyCronJobRunItem, ({ one }) => ({
    run: one(agencyCronJobRun, {
        fields: [agencyCronJobRunItem.runId],
        references: [agencyCronJobRun.id],
    }),
    subscription: one(niscClientSubscription, {
        fields: [agencyCronJobRunItem.subscriptionId],
        references: [niscClientSubscription.id],
    }),
}));
export const AGENCY_CRON_JOB_KEYS = {
    SUBSCRIPTION_RENEWAL_REMINDERS: "subscription-renewal-reminders",
};
