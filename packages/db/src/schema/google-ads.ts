import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { team } from "./teams";

// --- GoogleAdsIntegration ----------------------------------------------------

export const googleAdsIntegration = pgTable(
  "google_ads_integration",
  {
    id: text("id").primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    status: text("status").default("PENDING").notNull(),

    refreshToken: text("refresh_token").notNull(),
    accessToken: text("access_token").notNull(),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),

    scope: text("scope"),
    tokenType: text("token_type"),
    lastTokenRefreshAt: timestamp("last_token_refresh_at"),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("google_ads_integration_status_idx").on(table.status),
    index("google_ads_integration_userId_idx").on(table.userId),
  ],
);

// --- GoogleAdsAccount --------------------------------------------------------

export const googleAdsAccount = pgTable(
  "google_ads_account",
  {
    id: text("id").primaryKey(),

    integrationId: text("integration_id")
      .notNull()
      .references(() => googleAdsIntegration.id, { onDelete: "cascade" }),

    customerId: text("customer_id").notNull(),

    accountName: text("account_name"),
    currencyCode: text("currency_code"),
    timeZone: text("time_zone"),

    status: text("status").default("ACTIVE").notNull(),

    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("google_ads_account_integrationId_customerId_unique").on(
      table.integrationId,
      table.customerId,
    ),
    index("google_ads_account_integrationId_idx").on(table.integrationId),
    index("google_ads_account_customerId_idx").on(table.customerId),
    index("google_ads_account_status_idx").on(table.status),
    index("google_ads_account_teamId_idx").on(table.teamId),
  ],
);

// --- GoogleAdsIntegrationActivityLog ----------------------------------------

export const googleAdsIntegrationActivityLog = pgTable(
  "google_ads_integration_activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    integrationId: text("integration_id")
      .notNull()
      .references(() => googleAdsIntegration.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("google_ads_integration_activity_log_userId_idx").on(table.userId),
    index("google_ads_integration_activity_log_integrationId_idx").on(
      table.integrationId,
    ),
    index("google_ads_integration_activity_log_action_idx").on(table.action),
    index("google_ads_integration_activity_log_createdAt_idx").on(table.createdAt),
  ],
);

// --- GoogleAdsAccountActivityLog --------------------------------------------

export const googleAdsAccountActivityLog = pgTable(
  "google_ads_account_activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    accountId: text("account_id")
      .notNull()
      .references(() => googleAdsAccount.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("google_ads_account_activity_log_userId_idx").on(table.userId),
    index("google_ads_account_activity_log_accountId_idx").on(table.accountId),
    index("google_ads_account_activity_log_action_idx").on(table.action),
    index("google_ads_account_activity_log_createdAt_idx").on(table.createdAt),
  ],
);

// --- Relations ---------------------------------------------------------------

export const googleAdsIntegrationRelations = relations(
  googleAdsIntegration,
  ({ one, many }) => ({
    user: one(user, {
      fields: [googleAdsIntegration.userId],
      references: [user.id],
    }),
    accounts: many(googleAdsAccount),
    activityLogs: many(googleAdsIntegrationActivityLog),
  }),
);

export const googleAdsAccountRelations = relations(googleAdsAccount, ({ one, many }) => ({
  integration: one(googleAdsIntegration, {
    fields: [googleAdsAccount.integrationId],
    references: [googleAdsIntegration.id],
  }),
  team: one(team, {
    fields: [googleAdsAccount.teamId],
    references: [team.id],
  }),
  activityLogs: many(googleAdsAccountActivityLog),
}));

export const googleAdsIntegrationActivityLogRelations = relations(
  googleAdsIntegrationActivityLog,
  ({ one }) => ({
    integration: one(googleAdsIntegration, {
      fields: [googleAdsIntegrationActivityLog.integrationId],
      references: [googleAdsIntegration.id],
    }),
  }),
);

export const googleAdsAccountActivityLogRelations = relations(
  googleAdsAccountActivityLog,
  ({ one }) => ({
    account: one(googleAdsAccount, {
      fields: [googleAdsAccountActivityLog.accountId],
      references: [googleAdsAccount.id],
    }),
  }),
);

