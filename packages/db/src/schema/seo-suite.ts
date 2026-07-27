import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { team } from "./teams";

/** Kenya default used when creating projects (DataForSEO location_code). */
export const SEO_SUITE_DEFAULT_LOCATION_CODE = 2356;
export const SEO_SUITE_DEFAULT_LOCATION_NAME = "Kenya";
export const SEO_SUITE_DEFAULT_LANGUAGE_CODE = "en";

export const seoSuiteProject = pgTable(
  "seo_suite_project",
  {
    id: text("_id").primaryKey(),
    name: text("name").notNull(),
    primaryDomain: text("primary_domain").notNull(),
    locationCode: integer("location_code").default(SEO_SUITE_DEFAULT_LOCATION_CODE).notNull(),
    locationName: text("location_name").default(SEO_SUITE_DEFAULT_LOCATION_NAME).notNull(),
    languageCode: text("language_code").default(SEO_SUITE_DEFAULT_LANGUAGE_CODE).notNull(),
    brandEntities: jsonb("brand_entities").$type<string[]>().default([]).notNull(),
    competitorDomains: jsonb("competitor_domains").$type<string[]>().default([]).notNull(),
    gscSiteId: text("gsc_site_id"),
    ga4PropertyId: text("ga4_property_id"),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("seo_suite_project_createdById_idx").on(table.createdById),
    index("seo_suite_project_teamId_idx").on(table.teamId),
    index("seo_suite_project_primaryDomain_idx").on(table.primaryDomain),
    index("seo_suite_project_createdAt_idx").on(table.createdAt),
  ],
);

export const seoSuiteKeywordList = pgTable(
  "seo_suite_keyword_list",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("seo_suite_keyword_list_projectId_idx").on(table.projectId)],
);

export const seoSuiteSavedKeyword = pgTable(
  "seo_suite_saved_keyword",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    listId: text("list_id").references(() => seoSuiteKeywordList.id, { onDelete: "set null" }),
    keyword: text("keyword").notNull(),
    locationCode: integer("location_code"),
    languageCode: text("language_code"),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    notes: text("notes"),
    source: text("source").default("manual").notNull(),
    status: text("status").default("idea").notNull(),
    metricsCache: jsonb("metrics_cache"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("seo_suite_saved_keyword_projectId_idx").on(table.projectId),
    index("seo_suite_saved_keyword_listId_idx").on(table.listId),
    index("seo_suite_saved_keyword_keyword_idx").on(table.keyword),
  ],
);

export const seoSuiteRankTracker = pgTable(
  "seo_suite_rank_tracker",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    name: text("name").default("Default").notNull(),
    schedule: text("schedule").default("weekly").notNull(),
    device: text("device").default("desktop").notNull(),
    engine: text("engine").default("google").notNull(),
    locationCode: integer("location_code").notNull(),
    languageCode: text("language_code").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    lastRunAt: timestamp("last_run_at"),
    nextRunAt: timestamp("next_run_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("seo_suite_rank_tracker_projectId_idx").on(table.projectId)],
);

export const seoSuiteRankKeyword = pgTable(
  "seo_suite_rank_keyword",
  {
    id: text("_id").primaryKey(),
    trackerId: text("tracker_id")
      .notNull()
      .references(() => seoSuiteRankTracker.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_rank_keyword_trackerId_idx").on(table.trackerId),
    index("seo_suite_rank_keyword_projectId_idx").on(table.projectId),
  ],
);

export const seoSuiteRankResult = pgTable(
  "seo_suite_rank_result",
  {
    id: text("_id").primaryKey(),
    rankKeywordId: text("rank_keyword_id")
      .notNull()
      .references(() => seoSuiteRankKeyword.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    checkedAt: timestamp("checked_at").defaultNow().notNull(),
    rankAbsolute: integer("rank_absolute"),
    rankGroup: integer("rank_group"),
    url: text("url"),
    serpFeatures: jsonb("serp_features").$type<string[]>().default([]).notNull(),
    aiOverview: boolean("ai_overview").default(false).notNull(),
    serpSnapshot: jsonb("serp_snapshot"),
  },
  (table) => [
    index("seo_suite_rank_result_rankKeywordId_idx").on(table.rankKeywordId),
    index("seo_suite_rank_result_projectId_checkedAt_idx").on(table.projectId, table.checkedAt),
  ],
);

export const seoSuiteAuditRun = pgTable(
  "seo_suite_audit_run",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    targetUrl: text("target_url").notNull(),
    status: text("status").default("pending").notNull(),
    maxPages: integer("max_pages").default(100).notNull(),
    vendorTaskId: text("vendor_task_id"),
    score: integer("score"),
    summary: jsonb("summary"),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_audit_run_projectId_idx").on(table.projectId),
    index("seo_suite_audit_run_status_idx").on(table.status),
  ],
);

export const seoSuiteAuditIssue = pgTable(
  "seo_suite_audit_issue",
  {
    id: text("_id").primaryKey(),
    auditRunId: text("audit_run_id")
      .notNull()
      .references(() => seoSuiteAuditRun.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    severity: text("severity").default("warning").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    url: text("url"),
    evidence: jsonb("evidence"),
  },
  (table) => [
    index("seo_suite_audit_issue_auditRunId_idx").on(table.auditRunId),
    index("seo_suite_audit_issue_projectId_idx").on(table.projectId),
  ],
);

export const seoSuiteAuditPage = pgTable(
  "seo_suite_audit_page",
  {
    id: text("_id").primaryKey(),
    auditRunId: text("audit_run_id")
      .notNull()
      .references(() => seoSuiteAuditRun.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    statusCode: integer("status_code"),
    score: integer("score"),
    metrics: jsonb("metrics"),
  },
  (table) => [index("seo_suite_audit_page_auditRunId_idx").on(table.auditRunId)],
);

export const seoSuiteBacklinkSnapshot = pgTable(
  "seo_suite_backlink_snapshot",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    target: text("target").notNull(),
    summary: jsonb("summary"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => [index("seo_suite_backlink_snapshot_projectId_idx").on(table.projectId)],
);

export const seoSuiteAiEntity = pgTable(
  "seo_suite_ai_entity",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    value: text("value").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("seo_suite_ai_entity_projectId_idx").on(table.projectId)],
);

export const seoSuiteTrackedPrompt = pgTable(
  "seo_suite_tracked_prompt",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("seo_suite_tracked_prompt_projectId_idx").on(table.projectId)],
);

export const seoSuiteAiMentionSnapshot = pgTable(
  "seo_suite_ai_mention_snapshot",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    platform: text("platform"),
    payload: jsonb("payload"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => [index("seo_suite_ai_mention_snapshot_projectId_idx").on(table.projectId)],
);

export const seoSuitePromptRun = pgTable(
  "seo_suite_prompt_run",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    models: jsonb("models").$type<string[]>().default([]).notNull(),
    results: jsonb("results"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("seo_suite_prompt_run_projectId_idx").on(table.projectId)],
);

export const seoSuiteSerpCache = pgTable(
  "seo_suite_serp_cache",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id").references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    cacheKey: text("cache_key").notNull(),
    endpoint: text("endpoint").notNull(),
    payload: jsonb("payload"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_serp_cache_cacheKey_idx").on(table.cacheKey),
    index("seo_suite_serp_cache_expiresAt_idx").on(table.expiresAt),
  ],
);

export const seoSuiteAlertRule = pgTable(
  "seo_suite_alert_rule",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    ruleType: text("rule_type").notNull(),
    config: jsonb("config"),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("seo_suite_alert_rule_projectId_idx").on(table.projectId)],
);

export const seoSuiteAlertEvent = pgTable(
  "seo_suite_alert_event",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    ruleId: text("rule_id").references(() => seoSuiteAlertRule.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    message: text("message"),
    severity: text("severity").default("info").notNull(),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("seo_suite_alert_event_projectId_idx").on(table.projectId)],
);

export const seoSuiteReportRun = pgTable(
  "seo_suite_report_run",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    reportType: text("report_type").notNull(),
    title: text("title").notNull(),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("seo_suite_report_run_projectId_idx").on(table.projectId)],
);

export const seoSuiteVendorUsage = pgTable(
  "seo_suite_vendor_usage",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id").references(() => seoSuiteProject.id, { onDelete: "set null" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    api: text("api").notNull(),
    endpoint: text("endpoint").notNull(),
    units: integer("units").default(1).notNull(),
    costEstimate: doublePrecision("cost_estimate"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_vendor_usage_projectId_idx").on(table.projectId),
    index("seo_suite_vendor_usage_createdAt_idx").on(table.createdAt),
    index("seo_suite_vendor_usage_api_idx").on(table.api),
  ],
);

export const seoSuiteDomainSnapshot = pgTable(
  "seo_suite_domain_snapshot",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    target: text("target").notNull(),
    // Transformed domain overview metrics
    organicTraffic: integer("organic_traffic"),
    organicKeywords: integer("organic_keywords"),
    pos1Count: integer("pos1_count"),
    pos2_3Count: integer("pos2_3_count"),
    pos4_10Count: integer("pos4_10_count"),
    pos11_20Count: integer("pos11_20_count"),
    hasData: integer("has_data", { mode: "boolean" }).notNull().default(0),
    // Ranked keywords and pages stored as arrays
    rankedKeywords: jsonb("ranked_keywords").$type<Array<{
      keyword: string;
      position: number | null;
      searchVolume: number | null;
      traffic: number | null;
      cpc: number | null;
      keywordDifficulty: number | null;
      url: string | null;
    }>>().notNull().default([]),
    pages: jsonb("pages").$type<Array<{
      pageAddress: string;
      keywordCount: number | null;
      traffic: number | null;
    }>>().notNull().default([]),
    // Keep original payload for reference/debugging
    payload: jsonb("payload"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => [index("seo_suite_domain_snapshot_projectId_idx").on(table.projectId)],
);

// ─── Historical Data ──────────────────────────────────────────────────────────

export const seoSuiteHistoricalRank = pgTable(
  "seo_suite_historical_rank",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    target: text("target").notNull(),
    keyword: text("keyword").notNull(),
    position: integer("position"),
    searchVolume: integer("search_volume"),
    traffic: integer("traffic"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_historical_rank_projectId_idx").on(table.projectId),
    index("seo_suite_historical_rank_keyword_idx").on(table.keyword),
    index("seo_suite_historical_rank_capturedAt_idx").on(table.capturedAt),
  ],
);

export const seoSuiteHistoricalTraffic = pgTable(
  "seo_suite_historical_traffic",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    target: text("target").notNull(),
    organicTraffic: integer("organic_traffic"),
    organicKeywords: integer("organic_keywords"),
    paidTraffic: integer("paid_traffic"),
    paidKeywords: integer("paid_keywords"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_historical_traffic_projectId_idx").on(table.projectId),
    index("seo_suite_historical_traffic_capturedAt_idx").on(table.capturedAt),
  ],
);

export const seoSuiteHistoricalBacklink = pgTable(
  "seo_suite_historical_backlink",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    target: text("target").notNull(),
    totalBacklinks: integer("total_backlinks"),
    referringDomains: integer("referring_domains"),
    newBacklinks: integer("new_backlinks"),
    lostBacklinks: integer("lost_backlinks"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_historical_backlink_projectId_idx").on(table.projectId),
    index("seo_suite_historical_backlink_capturedAt_idx").on(table.capturedAt),
  ],
);

// ─── Advanced Keyword Features ────────────────────────────────────────────────

export const seoSuiteKeywordIntent = pgTable(
  "seo_suite_keyword_intent",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    intent: text("intent").notNull(), // informational, commercial, transactional, navigational
    intentProbability: doublePrecision("intent_probability"),
    difficulty: integer("difficulty"),
    searchVolume: integer("search_volume"),
    cpc: doublePrecision("cpc"),
    competition: doublePrecision("competition"),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_keyword_intent_projectId_idx").on(table.projectId),
    index("seo_suite_keyword_intent_keyword_idx").on(table.keyword),
    index("seo_suite_keyword_intent_intent_idx").on(table.intent),
  ],
);

export const seoSuiteKeywordCluster = pgTable(
  "seo_suite_keyword_cluster",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    primaryKeyword: text("primary_keyword").notNull(),
    keywords: jsonb("keywords").$type<string[]>().notNull().default([]),
    searchVolumeTotal: integer("search_volume_total"),
    avgDifficulty: doublePrecision("avg_difficulty"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("seo_suite_keyword_cluster_projectId_idx").on(table.projectId)],
);

export const seoSuiteTrendingKeyword = pgTable(
  "seo_suite_trending_keyword",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    searchVolume: integer("search_volume"),
    growthPercent: doublePrecision("growth_percent"),
    category: text("category"),
    payload: jsonb("payload"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_trending_keyword_projectId_idx").on(table.projectId),
    index("seo_suite_trending_keyword_capturedAt_idx").on(table.capturedAt),
  ],
);

// ─── Competitor Analysis ──────────────────────────────────────────────────────

export const seoSuiteCompetitorSnapshot = pgTable(
  "seo_suite_competitor_snapshot",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    competitorDomain: text("competitor_domain").notNull(),
    organicTraffic: integer("organic_traffic"),
    organicKeywords: integer("organic_keywords"),
    paidTraffic: integer("paid_traffic"),
    paidKeywords: integer("paid_keywords"),
    topPages: jsonb("top_pages").$type<Array<{
      url: string;
      traffic: number | null;
      keywords: number | null;
    }>>().notNull().default([]),
    topKeywords: jsonb("top_keywords").$type<Array<{
      keyword: string;
      position: number | null;
      volume: number | null;
    }>>().notNull().default([]),
    categories: jsonb("categories").$type<Array<{
      name: string;
      traffic: number | null;
      keywords: number | null;
    }>>().notNull().default([]),
    payload: jsonb("payload"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_competitor_snapshot_projectId_idx").on(table.projectId),
    index("seo_suite_competitor_snapshot_competitorDomain_idx").on(table.competitorDomain),
  ],
);

export const seoSuiteSubdomain = pgTable(
  "seo_suite_subdomain",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    subdomain: text("subdomain").notNull(),
    organicTraffic: integer("organic_traffic"),
    organicKeywords: integer("organic_keywords"),
    payload: jsonb("payload"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => [index("seo_suite_subdomain_projectId_idx").on(table.projectId)],
);

// ─── Content Strategy ─────────────────────────────────────────────────────────

export const seoSuiteContentGap = pgTable(
  "seo_suite_content_gap",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    competitorUrls: jsonb("competitor_urls").$type<string[]>().notNull().default([]),
    searchVolume: integer("search_volume"),
    difficulty: integer("difficulty"),
    intent: text("intent"),
    opportunity: text("opportunity"), // high, medium, low
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_content_gap_projectId_idx").on(table.projectId),
    index("seo_suite_content_gap_opportunity_idx").on(table.opportunity),
  ],
);

export const seoSuiteContentBrief = pgTable(
  "seo_suite_content_brief",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    targetUrl: text("target_url"),
    wordCount: integer("word_count"),
    headings: jsonb("headings").$type<string[]>().notNull().default([]),
    relatedKeywords: jsonb("related_keywords").$type<string[]>().notNull().default([]),
    topCompetitors: jsonb("top_competitors").$type<Array<{
      url: string;
      wordCount: number | null;
      headingCount: number | null;
    }>>().notNull().default([]),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("seo_suite_content_brief_projectId_idx").on(table.projectId)],
);

// ─── Page-Level Analysis ──────────────────────────────────────────────────────

export const seoSuitePageTracking = pgTable(
  "seo_suite_page_tracking",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    keywords: jsonb("keywords").$type<Array<{
      keyword: string;
      position: number | null;
      volume: number | null;
    }>>().notNull().default([]),
    traffic: integer("traffic"),
    lastCrawled: timestamp("last_crawled"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_page_tracking_projectId_idx").on(table.projectId),
    index("seo_suite_page_tracking_url_idx").on(table.url),
  ],
);

// ─── Link Intelligence ────────────────────────────────────────────────────────

export const seoSuiteLinkVelocity = pgTable(
  "seo_suite_link_velocity",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    target: text("target").notNull(),
    newLinks: integer("new_links"),
    lostLinks: integer("lost_links"),
    netChange: integer("net_change"),
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_link_velocity_projectId_idx").on(table.projectId),
    index("seo_suite_link_velocity_capturedAt_idx").on(table.capturedAt),
  ],
);

export const seoSuiteToxicLink = pgTable(
  "seo_suite_toxic_link",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    sourceUrl: text("source_url").notNull(),
    sourceDomain: text("source_domain").notNull(),
    targetUrl: text("target_url").notNull(),
    toxicScore: integer("toxic_score"), // 0-100
    reason: text("reason"),
    anchorText: text("anchor_text"),
    disavowed: integer("disavowed", { mode: "boolean" }).default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_toxic_link_projectId_idx").on(table.projectId),
    index("seo_suite_toxic_link_toxicScore_idx").on(table.toxicScore),
  ],
);

export const seoSuiteAnchorDistribution = pgTable(
  "seo_suite_anchor_distribution",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    target: text("target").notNull(),
    anchorText: text("anchor_text").notNull(),
    count: integer("count").notNull(),
    percentage: doublePrecision("percentage"),
    type: text("type"), // exact, partial, branded, generic, naked
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_anchor_distribution_projectId_idx").on(table.projectId),
    index("seo_suite_anchor_distribution_type_idx").on(table.type),
  ],
);

// ─── Local SEO ────────────────────────────────────────────────────────────────

export const seoSuiteLocalPackTracking = pgTable(
  "seo_suite_local_pack_tracking",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    businessName: text("business_name"),
    position: integer("position"),
    rating: doublePrecision("rating"),
    reviews: integer("reviews"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_local_pack_tracking_projectId_idx").on(table.projectId),
    index("seo_suite_local_pack_tracking_keyword_idx").on(table.keyword),
  ],
);

export const seoSuiteReviewSentiment = pgTable(
  "seo_suite_review_sentiment",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    source: text("source").notNull(), // google, trustpilot, etc
    rating: doublePrecision("rating"),
    sentiment: text("sentiment"), // positive, neutral, negative
    sentimentScore: doublePrecision("sentiment_score"),
    reviewText: text("review_text"),
    reviewDate: timestamp("review_date"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_review_sentiment_projectId_idx").on(table.projectId),
    index("seo_suite_review_sentiment_sentiment_idx").on(table.sentiment),
  ],
);

// ─── Smart Recommendations ────────────────────────────────────────────────────

export const seoSuiteRecommendation = pgTable(
  "seo_suite_recommendation",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // quick_win, opportunity, anomaly, task
    category: text("category").notNull(), // keyword, content, technical, link, local
    title: text("title").notNull(),
    description: text("description").notNull(),
    impact: text("impact"), // high, medium, low
    effort: text("effort"), // high, medium, low
    priority: integer("priority"), // calculated score
    actionUrl: text("action_url"),
    metadata: jsonb("metadata"),
    dismissed: integer("dismissed", { mode: "boolean" }).default(0).notNull(),
    completed: integer("completed", { mode: "boolean" }).default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_recommendation_projectId_idx").on(table.projectId),
    index("seo_suite_recommendation_type_idx").on(table.type),
    index("seo_suite_recommendation_priority_idx").on(table.priority),
  ],
);

export const seoSuiteAnomaly = pgTable(
  "seo_suite_anomaly",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    metricType: text("metric_type").notNull(), // traffic, rankings, backlinks, etc
    metric: text("metric").notNull(),
    changePercent: doublePrecision("change_percent"),
    changeAbsolute: integer("change_absolute"),
    previousValue: integer("previous_value"),
    currentValue: integer("current_value"),
    severity: text("severity"), // critical, warning, info
    acknowledged: integer("acknowledged", { mode: "boolean" }).default(0).notNull(),
    detectedAt: timestamp("detected_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_anomaly_projectId_idx").on(table.projectId),
    index("seo_suite_anomaly_severity_idx").on(table.severity),
    index("seo_suite_anomaly_detectedAt_idx").on(table.detectedAt),
  ],
);

// ─── Mobile & App SEO ─────────────────────────────────────────────────────────

export const seoSuiteAppData = pgTable(
  "seo_suite_app_data",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    appId: text("app_id").notNull(),
    platform: text("platform").notNull(), // ios, android
    appName: text("app_name"),
    rating: doublePrecision("rating"),
    reviews: integer("reviews"),
    installs: integer("installs"),
    keywords: jsonb("keywords").$type<Array<{
      keyword: string;
      rank: number | null;
      volume: number | null;
    }>>().notNull().default([]),
    payload: jsonb("payload"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_app_data_projectId_idx").on(table.projectId),
    index("seo_suite_app_data_platform_idx").on(table.platform),
  ],
);

export const seoSuiteMobileRank = pgTable(
  "seo_suite_mobile_rank",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    mobilePosition: integer("mobile_position"),
    desktopPosition: integer("desktop_position"),
    difference: integer("difference"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_mobile_rank_projectId_idx").on(table.projectId),
    index("seo_suite_mobile_rank_keyword_idx").on(table.keyword),
  ],
);

// ─── E-commerce SEO ───────────────────────────────────────────────────────────

export const seoSuiteProductListing = pgTable(
  "seo_suite_product_listing",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull(),
    platform: text("platform").notNull(), // google_shopping, amazon
    productName: text("product_name"),
    price: doublePrecision("price"),
    rating: doublePrecision("rating"),
    reviews: integer("reviews"),
    position: integer("position"),
    impressions: integer("impressions"),
    clicks: integer("clicks"),
    payload: jsonb("payload"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
  },
  (table) => [
    index("seo_suite_product_listing_projectId_idx").on(table.projectId),
    index("seo_suite_product_listing_platform_idx").on(table.platform),
  ],
);

// ─── Cost Controls ────────────────────────────────────────────────────────────

export const seoSuiteBudgetAlert = pgTable(
  "seo_suite_budget_alert",
  {
    id: text("_id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => seoSuiteProject.id, { onDelete: "cascade" }),
    monthlyBudget: doublePrecision("monthly_budget").notNull(),
    currentSpend: doublePrecision("current_spend").default(0).notNull(),
    alertThreshold: doublePrecision("alert_threshold").default(0.8).notNull(), // 80%
    alertSent: integer("alert_sent", { mode: "boolean" }).default(0).notNull(),
    enabled: integer("enabled", { mode: "boolean" }).default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("seo_suite_budget_alert_projectId_idx").on(table.projectId)],
);

export const seoSuiteProjectRelations = relations(seoSuiteProject, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [seoSuiteProject.createdById],
    references: [user.id],
  }),
  team: one(team, {
    fields: [seoSuiteProject.teamId],
    references: [team.id],
  }),
  keywordLists: many(seoSuiteKeywordList),
  savedKeywords: many(seoSuiteSavedKeyword),
  rankTrackers: many(seoSuiteRankTracker),
  auditRuns: many(seoSuiteAuditRun),
}));
