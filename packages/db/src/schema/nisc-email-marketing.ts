import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { team } from "./teams";

// =============================================================================
// nisc_em_domain — Sending domains verified with AWS SES
// =============================================================================
// One row per domain per team. The dkim_tokens array is what you show the
// customer so they know what CNAME records to add to their DNS provider.
// The webhook / background poller updates dkim_status and mail_from_status.
// =============================================================================

export const niscEmDomain = pgTable(
  "nisc_em_domain",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),

    domainName: text("domain_name").notNull(),

    // Top-level status driven by your app logic
    // PENDING → customer added domain, DNS not yet set
    // VERIFIED → dkimStatus === "Success"
    // FAILED   → SES returned "Failed" after retries
    // DELETING → removal requested, SES identity being cleaned up
    status: text("status").default("PENDING").notNull(),

    // From SES GetIdentityDkimAttributes: Pending | Success | Failed | TemporaryFailure | NotStarted
    dkimStatus: text("dkim_status").default("NotStarted").notNull(),

    // The 3 tokens returned by VerifyDomainDkim.
    // Each token maps to one CNAME record the customer must add:
    //   Name:  <token>._domainkey.<domain>
    //   Value: <token>.dkim.amazonses.com
    dkimTokens: jsonb("dkim_tokens").$type<string[]>().default([]),

    // Custom MAIL FROM subdomain, e.g. "mail.acme.com"
    // Set via SetIdentityMailFromDomain after DKIM verification
    // If mode is DEFAULT, we do NOT call SetIdentityMailFromDomain and SES uses
    // its default amazonses.com MAIL FROM behavior.
    mailFromMode: text("mail_from_mode").default("DEFAULT").notNull(),
    mailFromDomain: text("mail_from_domain"),

    // From SES GetIdentityMailFromDomainAttributes: Pending | Success | Failed | TemporaryFailure
    mailFromStatus: text("mail_from_status").default("Pending"),

    // Structured DNS records to render in your UI:
    // [{ type: "CNAME", name: "..._domainkey.domain", value: "....dkim.amazonses.com" },
    //  { type: "MX",    name: "mail.domain",          value: "feedback-smtp.us-east-1.amazonses.com" },
    //  { type: "TXT",   name: "mail.domain",          value: "v=spf1 include:amazonses.com ~all" }]
    dnsRecords: jsonb("dns_records").$type<
      { type: string; name: string; value: string; ttl?: number }[]
    >().default([]),

    // True after SetIdentityFeedbackForwardingEnabled(false) is called.
    // Must be disabled once verified so SES stops email-forwarding bounces/complaints
    // (they come through SNS instead — that is the whole point of our setup).
    feedbackForwardingDisabled: boolean("feedback_forwarding_disabled")
      .default(false)
      .notNull(),

    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("nisc_em_domain_teamId_domainName_idx").on(
      table.teamId,
      table.domainName,
    ),
    // When teamId is NULL, enforce per-user uniqueness at the DB level.
    // API will guarantee userId is non-null for created domains.
    uniqueIndex("nisc_em_domain_userId_domainName_idx").on(
      table.userId,
      table.domainName,
    ),
    index("nisc_em_domain_teamId_idx").on(table.teamId),
    index("nisc_em_domain_status_idx").on(table.status),
    index("nisc_em_domain_dkimStatus_idx").on(table.dkimStatus),
  ],
);

// =============================================================================
// nisc_em_audience — Contact lists (equivalent to Brevo "lists")
// =============================================================================

export const niscEmAudience = pgTable(
  "nisc_em_audience",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("nisc_em_audience_teamId_idx").on(table.teamId),
    index("nisc_em_audience_userId_idx").on(table.userId),
  ],
);

// =============================================================================
// nisc_em_contact — Individual contacts within an audience
// =============================================================================
// status is updated by the SNS webhook:
//   permanent bounce  → BOUNCED   + add to nisc_em_suppression
//   spam complaint    → COMPLAINED + add to nisc_em_suppression
//   unsubscribe click → UNSUBSCRIBED
// =============================================================================

export const niscEmContact = pgTable(
  "nisc_em_contact",
  {
    id: text("id").primaryKey(),
    audienceId: text("audience_id")
      .notNull()
      .references(() => niscEmAudience.id, { onDelete: "cascade" }),

    email: text("email").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    company: text("company"),
    phone: text("phone"),

    // SUBSCRIBED | UNSUBSCRIBED | BOUNCED | COMPLAINED
    status: text("status").default("SUBSCRIBED").notNull(),

    // Arbitrary custom fields: { region: "US", plan: "pro", ... }
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    subscribedAt: timestamp("subscribed_at"),
    unsubscribedAt: timestamp("unsubscribed_at"),
    bouncedAt: timestamp("bounced_at"),       // set on first permanent bounce
    complainedAt: timestamp("complained_at"), // set on first complaint

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    // A contact email must be unique within an audience
    uniqueIndex("nisc_em_contact_audienceId_email_idx").on(
      table.audienceId,
      table.email,
    ),
    index("nisc_em_contact_audienceId_idx").on(table.audienceId),
    index("nisc_em_contact_email_idx").on(table.email),
    index("nisc_em_contact_status_idx").on(table.status),
  ],
);

// =============================================================================
// nisc_em_campaign — Email campaigns
// =============================================================================

export const niscEmCampaign = pgTable(
  "nisc_em_campaign",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // The verified sending domain this campaign sends from
    domainId: text("domain_id").references(() => niscEmDomain.id, {
      onDelete: "set null",
    }),

    // The audience list to send to
    audienceId: text("audience_id").references(() => niscEmAudience.id, {
      onDelete: "set null",
    }),

    name: text("name").notNull(),
    subject: text("subject").notNull(),
    fromEmail: text("from_email").notNull(), // must be @verified_domain
    fromName: text("from_name"),
    replyTo: text("reply_to"),

    htmlContent: text("html_content"),
    textContent: text("text_content"),

    // DRAFT | SCHEDULED | SENDING | SENT | PAUSED | CANCELLED
    status: text("status").default("DRAFT").notNull(),

    // When false, uses SES_CONFIGURATION_SET_NO_TRACKING so SES does not
    // inject tracking pixels or wrap links. Open/click events won't arrive.
    trackingEnabled: boolean("tracking_enabled").default(true).notNull(),

    // Snapshot of recipient count taken at send time.
    // This is the denominator for all rate calculations:
    //   openRate = countWhere(opened_at IS NOT NULL) / totalRecipients
    totalRecipients: integer("total_recipients").default(0).notNull(),

    // Incremented as emails leave the queue — used for send progress
    totalSent: integer("total_sent").default(0).notNull(),

    scheduledAt: timestamp("scheduled_at"),
    sentAt: timestamp("sent_at"),       // when first email left the queue
    completedAt: timestamp("completed_at"), // when last email was sent

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("nisc_em_campaign_teamId_idx").on(table.teamId),
    index("nisc_em_campaign_userId_idx").on(table.userId),
    index("nisc_em_campaign_domainId_idx").on(table.domainId),
    index("nisc_em_campaign_audienceId_idx").on(table.audienceId),
    index("nisc_em_campaign_status_idx").on(table.status),
    index("nisc_em_campaign_scheduledAt_idx").on(table.scheduledAt),
  ],
);

// =============================================================================
// nisc_em_send_job — Background send job tracker
// =============================================================================
// One or more send jobs can exist per campaign (e.g. batched sends).
// QStash message ID is stored for deduplication and retry tracking.
// =============================================================================

export const niscEmSendJob = pgTable(
  "nisc_em_send_job",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => niscEmCampaign.id, { onDelete: "cascade" }),

    // QUEUED | PROCESSING | COMPLETED | FAILED | CANCELLED
    status: text("status").default("QUEUED").notNull(),

    qstashMessageId: text("qstash_message_id"),

    // How many emails this job is responsible for sending
    batchSize: integer("batch_size").default(0).notNull(),

    // Incremented as each SendRawEmail call completes — powers progress UI
    processedCount: integer("processed_count").default(0).notNull(),

    errorMessage: text("error_message"),
    scheduledFor: timestamp("scheduled_for"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("nisc_em_send_job_campaignId_idx").on(table.campaignId),
    index("nisc_em_send_job_status_idx").on(table.status),
    index("nisc_em_send_job_qstashMessageId_idx").on(table.qstashMessageId),
    index("nisc_em_send_job_scheduledFor_idx").on(table.scheduledFor),
  ],
);

// =============================================================================
// nisc_em_dispatcher_lease — Global dispatcher TTL lock
// =============================================================================
// Replaces the old session-scoped pg_try_advisory_lock approach, which was
// unreliable on a pooled connection (lock_key lives on the pg backend, not the
// pool client — so release could land on a different backend and leak the lock)
// and could leave the lock held indefinitely if the worker process crashed
// before releasing it.
//
// How it works:
//   - A dispatcher run inserts a row keyed by `lock_key` with its own `holder`
//     UUID and an `expires_at` 60s in the future.
//   - On conflict, we UPDATE the row only if the existing `expires_at` is in
//     the past — i.e. the previous holder is gone. This atomically steals the
//     lease from a crashed process.
//   - While running, the dispatcher heartbeats every 15s to push `expires_at`
//     forward, so long drains never see the lease expire.
//   - On clean shutdown, the holder DELETEs its own row (scoped by holder UUID
//     so we can't accidentally release someone else's lease).
//
// Keep this table small — it only ever contains one row per lock_key.
// =============================================================================

export const niscEmDispatcherLease = pgTable("nisc_em_dispatcher_lease", {
  lockKey: text("lock_key").primaryKey(),
  holder: text("holder").notNull(),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  heartbeatAt: timestamp("heartbeat_at", { withTimezone: true }).notNull(),
});

// =============================================================================
// nisc_em_email — One row per individual email send
// =============================================================================
// This is the core tracking table. Every call to SES SendRawEmail creates one
// row. The ses_message_id (returned by SES) is the lookup key used by every
// inbound SNS event notification — it is UNIQUE and heavily indexed.
//
// WHY denormalized counters + timestamp columns here (not only in events):
//   At scale (thousands of customers, daily campaigns) analytics queries are
//   aggregations: "open rate for campaign X" = COUNT(*) WHERE opened_at IS NOT
//   NULL. If those had to JOIN + aggregate the events table (which can have
//   millions of rows), every dashboard load would be slow. Denormalized columns
//   here make all campaign-level reporting O(1) per email row. The events table
//   is for per-event drill-down only (e.g. "what links did this person click?").
//   This is the same approach used by Brevo, Mailchimp, and Postmark internally.
// =============================================================================

export const niscEmEmail = pgTable(
  "nisc_em_email",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => niscEmCampaign.id, { onDelete: "cascade" }),
    contactId: text("contact_id").references(() => niscEmContact.id, {
      onDelete: "set null",
    }),

    // Snapshot of recipient address at send time (contact email may change later)
    toEmail: text("to_email").notNull(),
    fromEmail: text("from_email").notNull(),
    subject: text("subject").notNull(),

    // The MessageId returned by SES SendRawEmail.
    // Example: "0100017c1234abcd-f5e4d3c2-b1a0-9f8e-7d6c-5b4a3c2d1e0f-000000"
    // This is what arrives in body.mail.messageId on every SNS notification.
    // MUST be unique — SNS sends exactly one messageId per email sent.
    sesMessageId: text("ses_message_id").unique(),

    // QUEUED | SENDING | SENT | DELIVERED | OPENED | CLICKED | BOUNCED | COMPLAINED | FAILED
    // Follows the highest-severity event received (CLICKED > OPENED > DELIVERED > SENT)
    status: text("status").default("QUEUED").notNull(),

    // --- Denormalized analytics counters -----------------------------------
    // Incremented on every Open / Click event even after the first.
    // Useful for "most engaged contacts" reports and per-email engagement score.
    opens: integer("opens").default(0).notNull(),
    clicks: integer("clicks").default(0).notNull(),

    // --- Timestamps from SES event payloads --------------------------------
    // Each maps directly to a field in the SNS notification JSON.

    // Set when SendRawEmail call succeeds (no SES event, local timestamp)
    sentAt: timestamp("sent_at"),

    // From SNS Delivery event: body.delivery.timestamp
    deliveredAt: timestamp("delivered_at"),

    // From SNS Open event: body.open.timestamp — FIRST open only
    openedAt: timestamp("opened_at"),

    // From SNS Click event: body.click.timestamp — FIRST click only
    clickedAt: timestamp("clicked_at"),

    // From SNS Bounce event: body.bounce.timestamp
    bouncedAt: timestamp("bounced_at"),

    // From SNS Bounce event: body.bounce.bounceType
    // "Permanent" → hard bounce (unsubscribe + suppress)
    // "Transient" → soft bounce (do NOT suppress — mailbox full, OOO, etc.)
    bounceType: text("bounce_type"),

    // From SNS Bounce event: body.bounce.bounceSubType
    // Permanent sub-types: General | NoEmail | Suppressed | OnAccountSuppressionList
    // Transient sub-types: General | MailboxFull | MessageTooLarge | ContentRejected | AttachmentRejected
    bounceSubType: text("bounce_sub_type"),

    // From SNS Complaint event: body.complaint.timestamp
    complainedAt: timestamp("complained_at"),

    // From SNS Complaint event: body.complaint.complaintFeedbackType
    // abuse | fraud | virus | other (or null if ISP did not include it)
    complaintFeedbackType: text("complaint_feedback_type"),

    // Set if SendRawEmail itself throws — the SNS events will never arrive
    errorMessage: text("error_message"),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    // Primary hot path: SNS webhook fires → look up by ses_message_id
    // Declared unique above but explicit index for query planner
    index("nisc_em_email_sesMessageId_idx").on(table.sesMessageId),

    index("nisc_em_email_campaignId_idx").on(table.campaignId),
    index("nisc_em_email_contactId_idx").on(table.contactId),
    index("nisc_em_email_toEmail_idx").on(table.toEmail),
    index("nisc_em_email_status_idx").on(table.status),

    // Composite index for campaign-level analytics queries:
    //   SELECT COUNT(*) WHERE campaign_id = ? AND opened_at IS NOT NULL
    index("nisc_em_email_campaignId_openedAt_idx").on(
      table.campaignId,
      table.openedAt,
    ),
    index("nisc_em_email_campaignId_clickedAt_idx").on(
      table.campaignId,
      table.clickedAt,
    ),
    index("nisc_em_email_campaignId_bouncedAt_idx").on(
      table.campaignId,
      table.bouncedAt,
    ),
    index("nisc_em_email_campaignId_deliveredAt_idx").on(
      table.campaignId,
      table.deliveredAt,
    ),
  ],
);

// =============================================================================
// nisc_em_email_event — Raw event log (one row per SES event occurrence)
// =============================================================================
// Append-only. Never updated. Used for:
//   - Per-contact engagement history ("what links did John click?")
//   - Debugging ("why was this email marked bounced?")
//   - Feeding future ML models (time-of-open patterns, etc.)
//
// Column names map 1:1 to the SES SNS event notification JSON fields documented
// at https://docs.aws.amazon.com/ses/latest/dg/event-publishing-retrieving-sns-examples.html
// =============================================================================

export const niscEmEmailEvent = pgTable(
  "nisc_em_email_event",
  {
    id: text("id").primaryKey(),
    // Allow null emailId so the webhook event can be stored even if our
    // SendRawEmail row insert hasn't completed yet (common with retries).
    // We'll be able to backfill by sesMessageId.
    emailId: text("email_id").references(() => niscEmEmail.id, {
      onDelete: "set null",
    }),

    // SES MessageId (SendRawEmail response). Present in all event types as:
    //   body.mail.messageId
    sesMessageId: text("ses_message_id").notNull(),

    // eventType values from body.eventType in SES SNS notifications:
    //   Send | Delivery | Open | Click | Bounce | Complaint | DeliveryDelay | RenderingFailure
    eventType: text("event_type").notNull(),

    // The timestamp of the event as reported by AWS (not our insert time)
    // Delivery → body.delivery.timestamp
    // Open     → body.open.timestamp
    // Click    → body.click.timestamp
    // Bounce   → body.bounce.timestamp
    // Complaint→ body.complaint.timestamp
    occurredAt: timestamp("occurred_at").notNull(),

    // Recipient address at the time of the event.
    // Examples:
    // - Send/Delivery/Open/Click: body.mail.destination[0]
    // - Bounce: body.bounce.bouncedRecipients[0].emailAddress
    // - Complaint: typically body.complaint.complainedRecipients[0].emailAddress
    recipientEmail: text("recipient_email"),

    // --- Open / Click specific ---------------------------------------------
    // body.open.ipAddress | body.click.ipAddress
    ipAddress: text("ip_address"),

    // body.open.userAgent | body.click.userAgent
    userAgent: text("user_agent"),

    // body.click.link — the original URL before SES wrapped it
    link: text("link"),

    // body.click.linkTags — custom tags you added to links in the template
    linkTags: jsonb("link_tags").$type<Record<string, string[]>>(),

    // --- Bounce specific ---------------------------------------------------
    // body.bounce.bounceType: Permanent | Transient
    bounceType: text("bounce_type"),

    // body.bounce.bounceSubType
    bounceSubType: text("bounce_sub_type"),

    // body.bounce.bouncedRecipients[0].diagnosticCode
    // Example: "smtp; 550 5.1.1 The email account does not exist"
    bounceSmtpResponse: text("bounce_smtp_response"),

    // body.bounce.feedbackId
    bounceFeedbackId: text("bounce_feedback_id"),

    // body.bounce.remoteMtaIp
    bounceRemoteMtaIp: text("bounce_remote_mta_ip"),

    // body.bounce.reportingMTA
    bounceReportingMta: text("bounce_reporting_mta"),

    // body.bounce.bouncedRecipients[0].action (e.g. "failed")
    bounceAction: text("bounce_action"),

    // body.bounce.bouncedRecipients[0].status (e.g. "5.1.1")
    bounceRecipientStatus: text("bounce_recipient_status"),

    // --- Complaint specific ------------------------------------------------
    // body.complaint.complaintFeedbackType: abuse | fraud | virus | other
    complaintFeedbackType: text("complaint_feedback_type"),

    // body.complaint.complainedRecipients[0].emailAddress (if present)
    complainedRecipientEmail: text("complained_recipient_email"),

    // --- Delivery specific -------------------------------------------------
    // body.delivery.processingTimeMillis
    deliveryProcessingMs: integer("delivery_processing_ms"),

    // body.delivery.smtpResponse: "250 2.6.0 Message received"
    deliverySmtpResponse: text("delivery_smtp_response"),

    // body.delivery.remoteMtaIp
    deliveryRemoteMtaIp: text("delivery_remote_mta_ip"),

    // body.delivery.reportingMTA
    deliveryReportingMta: text("delivery_reporting_mta"),

    // body.delivery.recipients (array)
    deliveryRecipients: jsonb("delivery_recipients").$type<string[]>(),

    // --- DeliveryDelay specific --------------------------------------------
    // body.deliveryDelay.delayType: InternalFailure | General | NoAddressFound
    // | MailboxFull | SpamDetected | RecipientServerError | IPFailure
    // | TransientCommunicationFailure | BYOIPHostNameLookupUnavailable
    // | UnderprivilegedSendingAddress | AccountSuspended
    delayType: text("delay_type"),

    // Parsed SES event JSON from SNS Message (inner payload).
    rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>(),

    /** Full HTTP body of the SNS POST (outer envelope: Type, Message, TopicArn, …). */
    rawSnsBody: text("raw_sns_body"),

    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("nisc_em_email_event_emailId_idx").on(table.emailId),
    index("nisc_em_email_event_sesMessageId_idx").on(table.sesMessageId),
    index("nisc_em_email_event_eventType_idx").on(table.eventType),
    index("nisc_em_email_event_occurredAt_idx").on(table.occurredAt),
    // Composite for "all click events for an email" drill-down
    index("nisc_em_email_event_emailId_eventType_idx").on(
      table.emailId,
      table.eventType,
    ),
  ],
);

// =============================================================================
// nisc_em_suppression — Suppression list (per-team or account-wide)
// =============================================================================
// Hard-bounces and complaints become rows here (`reason` = HARD_BOUNCE | COMPLAINT | MANUAL).
// Same address may have both a bounce and a complaint row (different `reason`).
// - team_id set → applies only to that team’s sends.
// - team_id NULL → account-wide (e.g. SES test send with no nisc_em_email row).
// =============================================================================

export const niscEmSuppression = pgTable(
  "nisc_em_suppression",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id").references(() => team.id, { onDelete: "cascade" }),

    email: text("email").notNull(),

    // HARD_BOUNCE | COMPLAINT | MANUAL
    reason: text("reason").notNull(),

    // Which campaign/email triggered the suppression (nullable — manual entries have no source)
    sourceCampaignId: text("source_campaign_id").references(
      () => niscEmCampaign.id,
      { onDelete: "set null" },
    ),
    sourceEmailId: text("source_email_id").references(() => niscEmEmail.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("nisc_em_suppression_team_email_reason_uq")
      .on(table.teamId, table.email, table.reason)
      .where(sql`${table.teamId} IS NOT NULL`),
    uniqueIndex("nisc_em_suppression_account_email_reason_uq")
      .on(table.email, table.reason)
      .where(sql`${table.teamId} IS NULL`),
    index("nisc_em_suppression_teamId_idx").on(table.teamId),
    index("nisc_em_suppression_reason_idx").on(table.reason),
  ],
);

// =============================================================================
// nisc_em_quota_window — snapshot of SES account quota (24-hour window)
// =============================================================================
// SES exposes account-level limits:
// - Max24HourSend (emails per 24-hour rolling window)
// - MaxSendRate   (emails per second)
// - SentLast24Hours (already-sent emails within the last 24 hours)
//
// We take a snapshot and manage reservations inside our app.
// =============================================================================

export const niscEmQuotaWindow = pgTable(
  "nisc_em_quota_window",
  {
    id: text("id").primaryKey(),

    windowStart: timestamp("window_start").notNull(),
    windowEnd: timestamp("window_end").notNull(),

    // SES snapshot
    maxSendRate: integer("max_send_rate").notNull(),
    max24HourSend: integer("max_24_hour_send").notNull(),
    sentLast24HoursAtStart: integer("sent_last_24_hours_at_start").notNull(),

    // Allocations we reserved (projected usage)
    reservedEmails: integer("reserved_emails").default(0).notNull(),

    // Optional: can be updated later when we have actual send outcomes.
    actualSentEmails: integer("actual_sent_emails").default(0).notNull(),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("nisc_em_quota_window_start_end_idx").on(
      table.windowStart,
      table.windowEnd,
    ),
    index("nisc_em_quota_window_end_idx").on(table.windowEnd),
  ],
);

// =============================================================================
// nisc_em_quota_reservation — projected quota usage for a send job
// =============================================================================

export const niscEmQuotaReservation = pgTable(
  "nisc_em_quota_reservation",
  {
    id: text("id").primaryKey(),

    windowId: text("window_id")
      .notNull()
      .references(() => niscEmQuotaWindow.id, { onDelete: "cascade" }),

    // Who requested the send (scoped for reporting)
    teamId: text("team_id").references(() => team.id, {
      onDelete: "set null",
    }),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),

    campaignId: text("campaign_id").references(() => niscEmCampaign.id, {
      onDelete: "set null",
    }),
    sendJobId: text("send_job_id").references(() => niscEmSendJob.id, {
      onDelete: "set null",
    }),

    requestedEmails: integer("requested_emails").notNull(),

    // RESERVED: we estimated they would consume quota and we allowed execution
    // CONSUMED: job actually sent requestedEmails successfully (later update)
    // RELEASED: reservation released (later)
    // RESCHEDULED: reservation triggered rescheduling (later)
    status: text("status").default("RESERVED").notNull(),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("nisc_em_quota_reservation_windowId_idx").on(table.windowId),
    index("nisc_em_quota_reservation_status_idx").on(table.status),
    index("nisc_em_quota_reservation_sendJobId_idx").on(table.sendJobId),
    uniqueIndex("nisc_em_quota_reservation_sendJob_unique_idx").on(
      table.sendJobId,
      table.windowId,
    ),
  ],
);

// =============================================================================
// Relations
// =============================================================================

export const niscEmDomainRelations = relations(niscEmDomain, ({ one, many }) => ({
  team: one(team, {
    fields: [niscEmDomain.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [niscEmDomain.userId],
    references: [user.id],
  }),
  campaigns: many(niscEmCampaign),
}));

export const niscEmAudienceRelations = relations(niscEmAudience, ({ one, many }) => ({
  team: one(team, {
    fields: [niscEmAudience.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [niscEmAudience.userId],
    references: [user.id],
  }),
  contacts: many(niscEmContact),
  campaigns: many(niscEmCampaign),
}));

export const niscEmContactRelations = relations(niscEmContact, ({ one, many }) => ({
  audience: one(niscEmAudience, {
    fields: [niscEmContact.audienceId],
    references: [niscEmAudience.id],
  }),
  emails: many(niscEmEmail),
}));

export const niscEmCampaignRelations = relations(niscEmCampaign, ({ one, many }) => ({
  team: one(team, {
    fields: [niscEmCampaign.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [niscEmCampaign.userId],
    references: [user.id],
  }),
  domain: one(niscEmDomain, {
    fields: [niscEmCampaign.domainId],
    references: [niscEmDomain.id],
  }),
  audience: one(niscEmAudience, {
    fields: [niscEmCampaign.audienceId],
    references: [niscEmAudience.id],
  }),
  emails: many(niscEmEmail),
  sendJobs: many(niscEmSendJob),
  suppressions: many(niscEmSuppression),
}));

export const niscEmSendJobRelations = relations(niscEmSendJob, ({ one }) => ({
  campaign: one(niscEmCampaign, {
    fields: [niscEmSendJob.campaignId],
    references: [niscEmCampaign.id],
  }),
}));

export const niscEmEmailRelations = relations(niscEmEmail, ({ one, many }) => ({
  campaign: one(niscEmCampaign, {
    fields: [niscEmEmail.campaignId],
    references: [niscEmCampaign.id],
  }),
  contact: one(niscEmContact, {
    fields: [niscEmEmail.contactId],
    references: [niscEmContact.id],
  }),
  events: many(niscEmEmailEvent),
}));

export const niscEmEmailEventRelations = relations(niscEmEmailEvent, ({ one }) => ({
  email: one(niscEmEmail, {
    fields: [niscEmEmailEvent.emailId],
    references: [niscEmEmail.id],
  }),
}));

export const niscEmSuppressionRelations = relations(niscEmSuppression, ({ one }) => ({
  team: one(team, {
    fields: [niscEmSuppression.teamId],
    references: [team.id],
  }),
  sourceCampaign: one(niscEmCampaign, {
    fields: [niscEmSuppression.sourceCampaignId],
    references: [niscEmCampaign.id],
  }),
  sourceEmail: one(niscEmEmail, {
    fields: [niscEmSuppression.sourceEmailId],
    references: [niscEmEmail.id],
  }),
}));

export const niscEmQuotaWindowRelations = relations(niscEmQuotaWindow, ({ many }) => ({
  reservations: many(niscEmQuotaReservation),
}));

export const niscEmQuotaReservationRelations = relations(
  niscEmQuotaReservation,
  ({ one }) => ({
    window: one(niscEmQuotaWindow, {
      fields: [niscEmQuotaReservation.windowId],
      references: [niscEmQuotaWindow.id],
    }),
  }),
);
