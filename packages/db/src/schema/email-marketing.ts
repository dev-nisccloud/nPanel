import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { team } from "./teams";

// --- EmailDomain -------------------------------------------------------------

export const emailDomain = pgTable(
  "email_domain",
  {
    id: text("id").primaryKey(),
    domainName: text("domain_name").notNull().unique(),
    resendDomainId: text("resend_domain_id"),
    status: text("status").default("PENDING").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    verificationStatus: text("verification_status"),
    verificationData: jsonb("verification_data"),
    dnsRecords: jsonb("dns_records"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    verifiedAt: timestamp("verified_at"),
  },
  (table) => [
    index("email_domain_userId_idx").on(table.userId),
    index("email_domain_teamId_idx").on(table.teamId),
    index("email_domain_status_idx").on(table.status),
    index("email_domain_domainName_idx").on(table.domainName),
  ],
);

// --- EmailCampaign -----------------------------------------------------------

export const emailCampaign = pgTable(
  "email_campaign",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    subject: text("subject").notNull(),
    fromEmail: text("from_email").notNull(),
    fromName: text("from_name"),
    status: text("status").default("DRAFT").notNull(),
    htmlContent: text("html_content"),
    textContent: text("text_content"),
    scheduledAt: timestamp("scheduled_at"),
    sentAt: timestamp("sent_at"),
    emailDomainId: text("email_domain_id").references(() => emailDomain.id, {
      onDelete: "set null",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("email_campaign_emailDomainId_idx").on(table.emailDomainId),
    index("email_campaign_userId_idx").on(table.userId),
    index("email_campaign_teamId_idx").on(table.teamId),
    index("email_campaign_status_idx").on(table.status),
    index("email_campaign_scheduledAt_idx").on(table.scheduledAt),
  ],
);

// --- EmailCampaignSendJob ----------------------------------------------------

export const emailCampaignSendJob = pgTable(
  "email_campaign_send_job",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => emailCampaign.id, { onDelete: "cascade" }),
    status: text("status").default("QUEUED").notNull(),
    qstashMessageId: text("qstash_message_id"),
    scheduledFor: timestamp("scheduled_for"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("email_campaign_send_job_campaignId_idx").on(table.campaignId),
    index("email_campaign_send_job_status_idx").on(table.status),
    index("email_campaign_send_job_scheduledFor_idx").on(table.scheduledFor),
    index("email_campaign_send_job_qstashMessageId_idx").on(table.qstashMessageId),
  ],
);

// --- CampaignRecipient -------------------------------------------------------

export const campaignRecipient = pgTable(
  "campaign_recipient",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => emailCampaign.id, { onDelete: "cascade" }),
    toEmail: text("to_email").notNull(),
    resendId: text("resend_id"),
    resendMessageId: text("resend_message_id"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("campaign_recipient_campaignId_idx").on(table.campaignId),
    index("campaign_recipient_toEmail_idx").on(table.toEmail),
    index("campaign_recipient_resendId_idx").on(table.resendId),
  ],
);

// --- EmailAudience -----------------------------------------------------------

export const emailAudience = pgTable(
  "email_audience",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("email_audience_userId_idx").on(table.userId),
    index("email_audience_teamId_idx").on(table.teamId),
    index("email_audience_createdAt_idx").on(table.createdAt),
  ],
);

// --- EmailAudienceContact ----------------------------------------------------

export const emailAudienceContact = pgTable(
  "email_audience_contact",
  {
    id: text("id").primaryKey(),
    audienceId: text("audience_id")
      .notNull()
      .references(() => emailAudience.id, { onDelete: "cascade" }),
    name: text("name"),
    phoneNumber: text("phone_number"),
    emailAddress: text("email_address"),
    description: text("description"),
    company: text("company"),
    // Prisma: optional enum with @default(SUBSCRIBED)
    status: text("status").default("SUBSCRIBED"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("email_audience_contact_audienceId_idx").on(table.audienceId),
    index("email_audience_contact_emailAddress_idx").on(table.emailAddress),
    index("email_audience_contact_status_idx").on(table.status),
  ],
);

// --- EmailEvent --------------------------------------------------------------

export const emailEvent = pgTable(
  "email_event",
  {
    id: text("id").primaryKey(),
    campaignRecipientId: text("campaign_recipient_id")
      .notNull()
      .references(() => campaignRecipient.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    eventCreatedAt: timestamp("event_created_at").notNull(),
    resendEmailId: text("resend_email_id"),
    data: jsonb("data").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("email_event_campaignRecipientId_idx").on(table.campaignRecipientId),
    index("email_event_type_idx").on(table.type),
    index("email_event_eventCreatedAt_idx").on(table.eventCreatedAt),
    index("email_event_resendEmailId_idx").on(table.resendEmailId),
  ],
);

// --- EmailEventActivityLog ---------------------------------------------------

export const emailEventActivityLog = pgTable(
  "email_event_activity_log",
  {
    id: text("id").primaryKey(),
    emailEventId: text("email_event_id")
      .notNull()
      .references(() => emailEvent.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("email_event_activity_log_emailEventId_idx").on(table.emailEventId),
    index("email_event_activity_log_action_idx").on(table.action),
    index("email_event_activity_log_createdAt_idx").on(table.createdAt),
  ],
);

// --- EmailDomainActivityLog --------------------------------------------------

export const emailDomainActivityLog = pgTable(
  "email_domain_activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    emailDomainId: text("email_domain_id")
      .notNull()
      .references(() => emailDomain.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("email_domain_activity_log_userId_idx").on(table.userId),
    index("email_domain_activity_log_emailDomainId_idx").on(table.emailDomainId),
    index("email_domain_activity_log_action_idx").on(table.action),
    index("email_domain_activity_log_createdAt_idx").on(table.createdAt),
  ],
);

// --- EmailCampaignActivityLog ------------------------------------------------

export const emailCampaignActivityLog = pgTable(
  "email_campaign_activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => emailCampaign.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("email_campaign_activity_log_userId_idx").on(table.userId),
    index("email_campaign_activity_log_campaignId_idx").on(table.campaignId),
    index("email_campaign_activity_log_action_idx").on(table.action),
    index("email_campaign_activity_log_createdAt_idx").on(table.createdAt),
  ],
);

// --- Relations ---------------------------------------------------------------

export const emailDomainRelations = relations(emailDomain, ({ one, many }) => ({
  user: one(user, {
    fields: [emailDomain.userId],
    references: [user.id],
  }),
  team: one(team, {
    fields: [emailDomain.teamId],
    references: [team.id],
  }),
  campaigns: many(emailCampaign),
  activityLogs: many(emailDomainActivityLog),
}));

export const emailCampaignRelations = relations(
  emailCampaign,
  ({ one, many }) => ({
    emailDomain: one(emailDomain, {
      fields: [emailCampaign.emailDomainId],
      references: [emailDomain.id],
    }),
    user: one(user, {
      fields: [emailCampaign.userId],
      references: [user.id],
    }),
    team: one(team, {
      fields: [emailCampaign.teamId],
      references: [team.id],
    }),
    recipients: many(campaignRecipient),
    sendJobs: many(emailCampaignSendJob),
    activityLogs: many(emailCampaignActivityLog),
  }),
);

export const emailCampaignSendJobRelations = relations(
  emailCampaignSendJob,
  ({ one }) => ({
    campaign: one(emailCampaign, {
      fields: [emailCampaignSendJob.campaignId],
      references: [emailCampaign.id],
    }),
  }),
);

export const campaignRecipientRelations = relations(
  campaignRecipient,
  ({ one, many }) => ({
    campaign: one(emailCampaign, {
      fields: [campaignRecipient.campaignId],
      references: [emailCampaign.id],
    }),
    emailEvents: many(emailEvent),
  }),
);

export const emailAudienceRelations = relations(emailAudience, ({ one, many }) => ({
  user: one(user, {
    fields: [emailAudience.userId],
    references: [user.id],
  }),
  team: one(team, {
    fields: [emailAudience.teamId],
    references: [team.id],
  }),
  contacts: many(emailAudienceContact),
}));

export const emailAudienceContactRelations = relations(
  emailAudienceContact,
  ({ one }) => ({
    audience: one(emailAudience, {
      fields: [emailAudienceContact.audienceId],
      references: [emailAudience.id],
    }),
  }),
);

export const emailEventRelations = relations(emailEvent, ({ one, many }) => ({
  campaignRecipient: one(campaignRecipient, {
    fields: [emailEvent.campaignRecipientId],
    references: [campaignRecipient.id],
  }),
  activityLogs: many(emailEventActivityLog),
}));

export const emailEventActivityLogRelations = relations(
  emailEventActivityLog,
  ({ one }) => ({
    emailEvent: one(emailEvent, {
      fields: [emailEventActivityLog.emailEventId],
      references: [emailEvent.id],
    }),
  }),
);

export const emailDomainActivityLogRelations = relations(
  emailDomainActivityLog,
  ({ one }) => ({
    emailDomain: one(emailDomain, {
      fields: [emailDomainActivityLog.emailDomainId],
      references: [emailDomain.id],
    }),
  }),
);

export const emailCampaignActivityLogRelations = relations(
  emailCampaignActivityLog,
  ({ one }) => ({
    campaign: one(emailCampaign, {
      fields: [emailCampaignActivityLog.campaignId],
      references: [emailCampaign.id],
    }),
  }),
);
