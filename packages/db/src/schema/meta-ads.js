import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uniqueIndex, } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { team } from "./teams";
// --- MetaAdsAccount ----------------------------------------------------------
// Prisma: `integrationId` → `SocialMediaIntegration` (port `social-media-marketing` before adding FK).
export const metaAdsAccount = pgTable("meta_ads_account", {
    id: text("id").primaryKey(),
    integrationId: text("integration_id").notNull(),
    // Meta Ad Account ID (e.g. act_…); Prisma field `accountId`
    accountId: text("account_id").notNull().unique(),
    accountName: text("account_name"),
    currency: text("currency"),
    timezone: text("timezone"),
    status: text("status").default("ACTIVE").notNull(),
    spendLimit: text("spend_limit"),
    amountSpent: text("amount_spent"),
    balance: text("balance"),
    instagramUserId: text("instagram_user_id"),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    uniqueIndex("meta_ads_account_integrationId_accountId_unique").on(table.integrationId, table.accountId),
    index("meta_ads_account_integrationId_idx").on(table.integrationId),
    index("meta_ads_account_accountId_idx").on(table.accountId),
    index("meta_ads_account_teamId_idx").on(table.teamId),
    index("meta_ads_account_status_idx").on(table.status),
]);
// --- MetaAdsCampaign ---------------------------------------------------------
// Prisma `accountId` here is FK → `MetaAdsAccount.id` (not the Meta `act_` string).
export const metaAdsCampaign = pgTable("meta_ads_campaign", {
    id: text("id").primaryKey(),
    accountId: text("account_id")
        .notNull()
        .references(() => metaAdsAccount.id, { onDelete: "cascade" }),
    campaignId: text("campaign_id").notNull(),
    campaignName: text("campaign_name"),
    objective: text("objective"),
    status: text("status").default("ACTIVE").notNull(),
    dailyBudget: text("daily_budget"),
    lifetimeBudget: text("lifetime_budget"),
    budgetRemaining: text("budget_remaining"),
    startTime: timestamp("start_time"),
    stopTime: timestamp("stop_time"),
    createdTime: timestamp("created_time"),
    updatedTime: timestamp("updated_time"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    uniqueIndex("meta_ads_campaign_accountId_campaignId_unique").on(table.accountId, table.campaignId),
    index("meta_ads_campaign_accountId_idx").on(table.accountId),
    index("meta_ads_campaign_campaignId_idx").on(table.campaignId),
    index("meta_ads_campaign_status_idx").on(table.status),
    index("meta_ads_campaign_objective_idx").on(table.objective),
]);
// --- MetaAdsAdSet ------------------------------------------------------------
// Prisma `campaignId` / `accountId` = FKs to internal row ids.
export const metaAdsAdSet = pgTable("meta_ads_ad_set", {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
        .notNull()
        .references(() => metaAdsCampaign.id, { onDelete: "cascade" }),
    accountId: text("account_id")
        .notNull()
        .references(() => metaAdsAccount.id, { onDelete: "cascade" }),
    adSetId: text("ad_set_id").notNull(),
    adSetName: text("ad_set_name"),
    status: text("status").default("ACTIVE").notNull(),
    dailyBudget: text("daily_budget"),
    lifetimeBudget: text("lifetime_budget"),
    budgetRemaining: text("budget_remaining"),
    bidAmount: text("bid_amount"),
    targeting: jsonb("targeting"),
    startTime: timestamp("start_time"),
    stopTime: timestamp("stop_time"),
    createdTime: timestamp("created_time"),
    updatedTime: timestamp("updated_time"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    uniqueIndex("meta_ads_ad_set_campaignId_adSetId_unique").on(table.campaignId, table.adSetId),
    index("meta_ads_ad_set_campaignId_idx").on(table.campaignId),
    index("meta_ads_ad_set_accountId_idx").on(table.accountId),
    index("meta_ads_ad_set_adSetId_idx").on(table.adSetId),
    index("meta_ads_ad_set_status_idx").on(table.status),
]);
// --- MetaAdsAd ---------------------------------------------------------------
// Prisma `adSetId` / `campaignId` / `accountId` = FKs to internal ids; `adId` = Meta ad id string.
export const metaAdsAd = pgTable("meta_ads_ad", {
    id: text("id").primaryKey(),
    adSetId: text("ad_set_id")
        .notNull()
        .references(() => metaAdsAdSet.id, { onDelete: "cascade" }),
    campaignId: text("campaign_id")
        .notNull()
        .references(() => metaAdsCampaign.id, { onDelete: "cascade" }),
    accountId: text("account_id")
        .notNull()
        .references(() => metaAdsAccount.id, { onDelete: "cascade" }),
    adId: text("ad_id").notNull(),
    adName: text("ad_name"),
    status: text("status").default("ACTIVE").notNull(),
    creative: jsonb("creative"),
    createdTime: timestamp("created_time"),
    updatedTime: timestamp("updated_time"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    uniqueIndex("meta_ads_ad_adSetId_adId_unique").on(table.adSetId, table.adId),
    index("meta_ads_ad_adSetId_idx").on(table.adSetId),
    index("meta_ads_ad_campaignId_idx").on(table.campaignId),
    index("meta_ads_ad_accountId_idx").on(table.accountId),
    index("meta_ads_ad_adId_idx").on(table.adId),
    index("meta_ads_ad_status_idx").on(table.status),
]);
// --- MetaAdsInsight ----------------------------------------------------------
// Prisma optional `accountId` / `campaignId` / `adSetId` / `adId` = FKs to internal row ids.
export const metaAdsInsight = pgTable("meta_ads_insight", {
    id: text("id").primaryKey(),
    accountId: text("account_id").references(() => metaAdsAccount.id, {
        onDelete: "cascade",
    }),
    campaignId: text("campaign_id").references(() => metaAdsCampaign.id, {
        onDelete: "cascade",
    }),
    adSetId: text("ad_set_id").references(() => metaAdsAdSet.id, {
        onDelete: "cascade",
    }),
    adId: text("ad_id").references(() => metaAdsAd.id, { onDelete: "cascade" }),
    dateStart: timestamp("date_start").notNull(),
    dateEnd: timestamp("date_end").notNull(),
    breakdown: jsonb("breakdown"),
    metrics: jsonb("metrics").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
}, (table) => [
    index("meta_ads_insight_accountId_idx").on(table.accountId),
    index("meta_ads_insight_campaignId_idx").on(table.campaignId),
    index("meta_ads_insight_adSetId_idx").on(table.adSetId),
    index("meta_ads_insight_adId_idx").on(table.adId),
    index("meta_ads_insight_dateStart_idx").on(table.dateStart),
    index("meta_ads_insight_dateEnd_idx").on(table.dateEnd),
]);
// --- Activity logs (Prisma `accountId` / `campaignId` / `adSetId` / `adId` = FK to parent `.id`)
export const metaAdsAccountActivityLog = pgTable("meta_ads_account_activity_log", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "restrict" }),
    accountId: text("account_id")
        .notNull()
        .references(() => metaAdsAccount.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("meta_ads_account_activity_userId_idx").on(table.userId),
    index("meta_ads_account_activity_accountId_idx").on(table.accountId),
    index("meta_ads_account_activity_action_idx").on(table.action),
    index("meta_ads_account_activity_createdAt_idx").on(table.createdAt),
]);
export const metaAdsCampaignActivityLog = pgTable("meta_ads_campaign_activity_log", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "restrict" }),
    campaignId: text("campaign_id")
        .notNull()
        .references(() => metaAdsCampaign.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("meta_ads_campaign_activity_userId_idx").on(table.userId),
    index("meta_ads_campaign_activity_campaignId_idx").on(table.campaignId),
    index("meta_ads_campaign_activity_action_idx").on(table.action),
    index("meta_ads_campaign_activity_createdAt_idx").on(table.createdAt),
]);
export const metaAdsAdSetActivityLog = pgTable("meta_ads_ad_set_activity_log", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "restrict" }),
    adSetId: text("ad_set_id")
        .notNull()
        .references(() => metaAdsAdSet.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("meta_ads_ad_set_activity_userId_idx").on(table.userId),
    index("meta_ads_ad_set_activity_adSetId_idx").on(table.adSetId),
    index("meta_ads_ad_set_activity_action_idx").on(table.action),
    index("meta_ads_ad_set_activity_createdAt_idx").on(table.createdAt),
]);
export const metaAdsAdActivityLog = pgTable("meta_ads_ad_activity_log", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "restrict" }),
    adId: text("ad_id")
        .notNull()
        .references(() => metaAdsAd.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("meta_ads_ad_activity_userId_idx").on(table.userId),
    index("meta_ads_ad_activity_adId_idx").on(table.adId),
    index("meta_ads_ad_activity_action_idx").on(table.action),
    index("meta_ads_ad_activity_createdAt_idx").on(table.createdAt),
]);
// --- Relations ---------------------------------------------------------------
export const metaAdsAccountRelations = relations(metaAdsAccount, ({ one, many }) => ({
    team: one(team, {
        fields: [metaAdsAccount.teamId],
        references: [team.id],
    }),
    campaigns: many(metaAdsCampaign),
    adSets: many(metaAdsAdSet),
    ads: many(metaAdsAd),
    insights: many(metaAdsInsight),
    activityLogs: many(metaAdsAccountActivityLog),
}));
export const metaAdsCampaignRelations = relations(metaAdsCampaign, ({ one, many }) => ({
    account: one(metaAdsAccount, {
        fields: [metaAdsCampaign.accountId],
        references: [metaAdsAccount.id],
    }),
    adSets: many(metaAdsAdSet),
    ads: many(metaAdsAd),
    insights: many(metaAdsInsight),
    activityLogs: many(metaAdsCampaignActivityLog),
}));
export const metaAdsAdSetRelations = relations(metaAdsAdSet, ({ one, many }) => ({
    campaign: one(metaAdsCampaign, {
        fields: [metaAdsAdSet.campaignId],
        references: [metaAdsCampaign.id],
    }),
    account: one(metaAdsAccount, {
        fields: [metaAdsAdSet.accountId],
        references: [metaAdsAccount.id],
    }),
    ads: many(metaAdsAd),
    insights: many(metaAdsInsight),
    activityLogs: many(metaAdsAdSetActivityLog),
}));
export const metaAdsAdRelations = relations(metaAdsAd, ({ one, many }) => ({
    adSet: one(metaAdsAdSet, {
        fields: [metaAdsAd.adSetId],
        references: [metaAdsAdSet.id],
    }),
    campaign: one(metaAdsCampaign, {
        fields: [metaAdsAd.campaignId],
        references: [metaAdsCampaign.id],
    }),
    account: one(metaAdsAccount, {
        fields: [metaAdsAd.accountId],
        references: [metaAdsAccount.id],
    }),
    insights: many(metaAdsInsight),
    activityLogs: many(metaAdsAdActivityLog),
}));
export const metaAdsInsightRelations = relations(metaAdsInsight, ({ one }) => ({
    account: one(metaAdsAccount, {
        fields: [metaAdsInsight.accountId],
        references: [metaAdsAccount.id],
    }),
    campaign: one(metaAdsCampaign, {
        fields: [metaAdsInsight.campaignId],
        references: [metaAdsCampaign.id],
    }),
    adSet: one(metaAdsAdSet, {
        fields: [metaAdsInsight.adSetId],
        references: [metaAdsAdSet.id],
    }),
    ad: one(metaAdsAd, {
        fields: [metaAdsInsight.adId],
        references: [metaAdsAd.id],
    }),
}));
export const metaAdsAccountActivityLogRelations = relations(metaAdsAccountActivityLog, ({ one }) => ({
    user: one(user, {
        fields: [metaAdsAccountActivityLog.userId],
        references: [user.id],
    }),
    account: one(metaAdsAccount, {
        fields: [metaAdsAccountActivityLog.accountId],
        references: [metaAdsAccount.id],
    }),
}));
export const metaAdsCampaignActivityLogRelations = relations(metaAdsCampaignActivityLog, ({ one }) => ({
    user: one(user, {
        fields: [metaAdsCampaignActivityLog.userId],
        references: [user.id],
    }),
    campaign: one(metaAdsCampaign, {
        fields: [metaAdsCampaignActivityLog.campaignId],
        references: [metaAdsCampaign.id],
    }),
}));
export const metaAdsAdSetActivityLogRelations = relations(metaAdsAdSetActivityLog, ({ one }) => ({
    user: one(user, {
        fields: [metaAdsAdSetActivityLog.userId],
        references: [user.id],
    }),
    adSet: one(metaAdsAdSet, {
        fields: [metaAdsAdSetActivityLog.adSetId],
        references: [metaAdsAdSet.id],
    }),
}));
export const metaAdsAdActivityLogRelations = relations(metaAdsAdActivityLog, ({ one }) => ({
    user: one(user, {
        fields: [metaAdsAdActivityLog.userId],
        references: [user.id],
    }),
    ad: one(metaAdsAd, {
        fields: [metaAdsAdActivityLog.adId],
        references: [metaAdsAd.id],
    }),
}));
