import { relations } from "drizzle-orm";
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
import { metaAdsAccount } from "./meta-ads";

// --- SocialMediaIntegration --------------------------------------------------

export const socialMediaIntegration = pgTable(
  "social_media_integration",
  {
    id: text("_id").primaryKey(),
    platform: text("platform").notNull(),
    status: text("status").default("PENDING").notNull(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    accessToken: text("access_token").notNull(),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshToken: text("refresh_token"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),

    scope: text("scope"),
    tokenType: text("token_type"),
    lastTokenRefreshAt: timestamp("last_token_refresh_at"),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("social_media_integration_platform_idx").on(table.platform),
    index("social_media_integration_status_idx").on(table.status),
    index("social_media_integration_userId_idx").on(table.userId),
  ],
);

// --- SocialMediaPageToken ----------------------------------------------------

export const socialMediaPageToken = pgTable(
  "social_media_page_token",
  {
    id: text("_id").primaryKey(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => socialMediaIntegration.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),

    platform: text("platform").notNull(),

    pageId: text("page_id").notNull(),
    pageName: text("page_name"),
    pageUsername: text("page_username"),
    pagePicture: text("page_picture"),
    pageCategory: text("page_category"),

    accessToken: text("access_token").notNull(),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    isActive: boolean("is_active").default(true).notNull(),
    lastTokenRefreshAt: timestamp("last_token_refresh_at"),

    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("social_media_page_token_integrationId_pageId_unique").on(
      table.integrationId,
      table.pageId,
    ),
    index("social_media_page_token_integrationId_idx").on(table.integrationId),
    index("social_media_page_token_pageId_idx").on(table.pageId),
    index("social_media_page_token_platform_idx").on(table.platform),
    index("social_media_page_token_teamId_idx").on(table.teamId),
    index("social_media_page_token_isActive_idx").on(table.isActive),
    index("social_media_page_token_accessTokenExpiresAt_idx").on(
      table.accessTokenExpiresAt,
    ),
  ],
);

// --- SocialMediaIntegrationActivityLog --------------------------------------

export const socialMediaIntegrationActivityLog = pgTable(
  "social_media_integration_activity_log",
  {
    id: text("_id").primaryKey(),
    userId: text("user_id").notNull(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => socialMediaIntegration.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("social_media_integration_activity_log_userId_idx").on(table.userId),
    index("social_media_integration_activity_log_integrationId_idx").on(
      table.integrationId,
    ),
    index("social_media_integration_activity_log_action_idx").on(table.action),
    index("social_media_integration_activity_log_createdAt_idx").on(table.createdAt),
  ],
);

// --- SocialMediaPageTokenActivityLog ----------------------------------------

export const socialMediaPageTokenActivityLog = pgTable(
  "social_media_page_token_activity_log",
  {
    id: text("_id").primaryKey(),
    userId: text("user_id").notNull(),
    pageTokenId: text("page_token_id")
      .notNull()
      .references(() => socialMediaPageToken.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("social_media_page_token_activity_log_userId_idx").on(table.userId),
    index("social_media_page_token_activity_log_pageTokenId_idx").on(table.pageTokenId),
    index("social_media_page_token_activity_log_action_idx").on(table.action),
    index("social_media_page_token_activity_log_createdAt_idx").on(table.createdAt),
  ],
);

// --- MetaContentCalendar -----------------------------------------------------

export const metaContentCalendar = pgTable(
  "meta_content_calendar",
  {
    id: text("_id").primaryKey(),
    pageTokenId: text("page_token_id").references(() => socialMediaPageToken.id, {
      onDelete: "set null",
    }),
    message: text("message"),
    scheduledPublishTime: timestamp("scheduled_publish_time").notNull(),
    status: text("status").default("SCHEDULED").notNull(),
    published: boolean("published").default(false).notNull(),
    publishedAt: timestamp("published_at"),
    publishedPostId: text("published_post_id"),
    publishedPermalink: text("published_permalink"),
    lastError: text("last_error"),
    retryCount: integer("retry_count").default(0).notNull(),
    lastRetryAt: timestamp("last_retry_at"),
    qstashJobId: text("qstash_job_id"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("meta_content_calendar_pageTokenId_idx").on(table.pageTokenId),
    index("meta_content_calendar_status_idx").on(table.status),
    index("meta_content_calendar_scheduledPublishTime_idx").on(
      table.scheduledPublishTime,
    ),
    index("meta_content_calendar_published_idx").on(table.published),
    index("meta_content_calendar_createdBy_idx").on(table.createdBy),
    index("meta_content_calendar_createdAt_idx").on(table.createdAt),
  ],
);

// --- MetaContentCalendarMedia ------------------------------------------------

export const metaContentCalendarMedia = pgTable(
  "meta_content_calendar_media",
  {
    id: text("_id").primaryKey(),
    calendarPostId: text("calendar_post_id")
      .notNull()
      .references(() => metaContentCalendar.id, { onDelete: "cascade" }),
    mediaType: text("media_type").notNull(),
    url: text("url").notNull(),
    fileName: text("file_name"),
    fileSize: integer("file_size"),
    caption: text("caption"),
    description: text("description"),
    order: integer("order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("meta_content_calendar_media_calendarPostId_idx").on(table.calendarPostId),
    index("meta_content_calendar_media_mediaType_idx").on(table.mediaType),
    index("meta_content_calendar_media_order_idx").on(table.order),
  ],
);

// --- MetaContentCalendarActivityLog -----------------------------------------

export const metaContentCalendarActivityLog = pgTable(
  "meta_content_calendar_activity_log",
  {
    id: text("_id").primaryKey(),
    userId: text("user_id").notNull(),
    calendarPostId: text("calendar_post_id")
      .notNull()
      .references(() => metaContentCalendar.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("meta_content_calendar_activity_log_userId_idx").on(table.userId),
    index("meta_content_calendar_activity_log_calendarPostId_idx").on(
      table.calendarPostId,
    ),
    index("meta_content_calendar_activity_log_action_idx").on(table.action),
    index("meta_content_calendar_activity_log_createdAt_idx").on(table.createdAt),
  ],
);

// --- LinkedInContentCalendar -------------------------------------------------

export const linkedInContentCalendar = pgTable(
  "linkedin_content_calendar",
  {
    id: text("_id").primaryKey(),
    pageTokenId: text("page_token_id").references(() => socialMediaPageToken.id, {
      onDelete: "set null",
    }),
    message: text("message"),
    scheduledPublishTime: timestamp("scheduled_publish_time").notNull(),
    status: text("status").default("SCHEDULED").notNull(),
    published: boolean("published").default(false).notNull(),
    publishedAt: timestamp("published_at"),
    publishedPostId: text("published_post_id"),
    publishedPermalink: text("published_permalink"),
    lastError: text("last_error"),
    retryCount: integer("retry_count").default(0).notNull(),
    lastRetryAt: timestamp("last_retry_at"),
    qstashJobId: text("qstash_job_id"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("linkedin_content_calendar_pageTokenId_idx").on(table.pageTokenId),
    index("linkedin_content_calendar_status_idx").on(table.status),
    index("linkedin_content_calendar_scheduledPublishTime_idx").on(
      table.scheduledPublishTime,
    ),
    index("linkedin_content_calendar_published_idx").on(table.published),
    index("linkedin_content_calendar_createdBy_idx").on(table.createdBy),
    index("linkedin_content_calendar_createdAt_idx").on(table.createdAt),
  ],
);

// --- LinkedInContentCalendarMedia -------------------------------------------

export const linkedInContentCalendarMedia = pgTable(
  "linkedin_content_calendar_media",
  {
    id: text("_id").primaryKey(),
    calendarPostId: text("calendar_post_id")
      .notNull()
      .references(() => linkedInContentCalendar.id, { onDelete: "cascade" }),
    mediaType: text("media_type").notNull(),
    url: text("url").notNull(),
    fileName: text("file_name"),
    fileSize: integer("file_size"),
    caption: text("caption"),
    description: text("description"),
    order: integer("order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("linkedin_content_calendar_media_calendarPostId_idx").on(table.calendarPostId),
    index("linkedin_content_calendar_media_mediaType_idx").on(table.mediaType),
    index("linkedin_content_calendar_media_order_idx").on(table.order),
  ],
);

// --- LinkedInContentCalendarActivityLog -------------------------------------

export const linkedInContentCalendarActivityLog = pgTable(
  "linkedin_content_calendar_activity_log",
  {
    id: text("_id").primaryKey(),
    userId: text("user_id").notNull(),
    calendarPostId: text("calendar_post_id")
      .notNull()
      .references(() => linkedInContentCalendar.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("linkedin_content_calendar_activity_log_userId_idx").on(table.userId),
    index("linkedin_content_calendar_activity_log_calendarPostId_idx").on(
      table.calendarPostId,
    ),
    index("linkedin_content_calendar_activity_log_action_idx").on(table.action),
    index("linkedin_content_calendar_activity_log_createdAt_idx").on(table.createdAt),
  ],
);

// --- Deferred import-cycle FK ------------------------------------------------
// Prisma: SocialMediaIntegration.metaAdsAccounts refers to MetaAdsAccount.integrationId.
// In Drizzle, `meta-ads.ts` currently keeps `integration_id` without FK to avoid
// an import cycle. We add the FK here instead (still creates DB-level constraint).
// --- Relations ---------------------------------------------------------------

export const socialMediaIntegrationRelations = relations(
  socialMediaIntegration,
  ({ one, many }) => ({
    user: one(user, {
      fields: [socialMediaIntegration.userId],
      references: [user.id],
    }),
    pageTokens: many(socialMediaPageToken),
    activityLogs: many(socialMediaIntegrationActivityLog),
    metaAdsAccounts: many(metaAdsAccount),
  }),
);

export const socialMediaPageTokenRelations = relations(
  socialMediaPageToken,
  ({ one, many }) => ({
    integration: one(socialMediaIntegration, {
      fields: [socialMediaPageToken.integrationId],
      references: [socialMediaIntegration.id],
    }),
    team: one(team, {
      fields: [socialMediaPageToken.teamId],
      references: [team.id],
    }),
    user: one(user, {
      fields: [socialMediaPageToken.userId],
      references: [user.id],
    }),
    activityLogs: many(socialMediaPageTokenActivityLog),
    contentCalendarPosts: many(metaContentCalendar),
    linkedInContentCalendarPosts: many(linkedInContentCalendar),
  }),
);

export const socialMediaIntegrationActivityLogRelations = relations(
  socialMediaIntegrationActivityLog,
  ({ one }) => ({
    integration: one(socialMediaIntegration, {
      fields: [socialMediaIntegrationActivityLog.integrationId],
      references: [socialMediaIntegration.id],
    }),
  }),
);

export const socialMediaPageTokenActivityLogRelations = relations(
  socialMediaPageTokenActivityLog,
  ({ one }) => ({
    pageToken: one(socialMediaPageToken, {
      fields: [socialMediaPageTokenActivityLog.pageTokenId],
      references: [socialMediaPageToken.id],
    }),
  }),
);

export const metaContentCalendarRelations = relations(
  metaContentCalendar,
  ({ one, many }) => ({
    pageToken: one(socialMediaPageToken, {
      fields: [metaContentCalendar.pageTokenId],
      references: [socialMediaPageToken.id],
    }),
    user: one(user, {
      fields: [metaContentCalendar.createdBy],
      references: [user.id],
    }),
    mediaItems: many(metaContentCalendarMedia),
    activityLogs: many(metaContentCalendarActivityLog),
  }),
);

export const metaContentCalendarMediaRelations = relations(
  metaContentCalendarMedia,
  ({ one }) => ({
    calendarPost: one(metaContentCalendar, {
      fields: [metaContentCalendarMedia.calendarPostId],
      references: [metaContentCalendar.id],
    }),
  }),
);

export const metaContentCalendarActivityLogRelations = relations(
  metaContentCalendarActivityLog,
  ({ one }) => ({
    calendarPost: one(metaContentCalendar, {
      fields: [metaContentCalendarActivityLog.calendarPostId],
      references: [metaContentCalendar.id],
    }),
  }),
);

export const linkedInContentCalendarRelations = relations(
  linkedInContentCalendar,
  ({ one, many }) => ({
    pageToken: one(socialMediaPageToken, {
      fields: [linkedInContentCalendar.pageTokenId],
      references: [socialMediaPageToken.id],
    }),
    user: one(user, {
      fields: [linkedInContentCalendar.createdBy],
      references: [user.id],
    }),
    mediaItems: many(linkedInContentCalendarMedia),
    activityLogs: many(linkedInContentCalendarActivityLog),
  }),
);

export const linkedInContentCalendarMediaRelations = relations(
  linkedInContentCalendarMedia,
  ({ one }) => ({
    calendarPost: one(linkedInContentCalendar, {
      fields: [linkedInContentCalendarMedia.calendarPostId],
      references: [linkedInContentCalendar.id],
    }),
  }),
);

export const linkedInContentCalendarActivityLogRelations = relations(
  linkedInContentCalendarActivityLog,
  ({ one }) => ({
    calendarPost: one(linkedInContentCalendar, {
      fields: [linkedInContentCalendarActivityLog.calendarPostId],
      references: [linkedInContentCalendar.id],
    }),
  }),
);

