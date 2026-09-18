import { jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export type PageSpeedMetricCell = {
  value: number | null;
  displayValue: string | null;
  score: number | null;
} | null;

export type PageSpeedFormattedResult = {
  performance: {
    score: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  };
  metrics: {
    lcp: PageSpeedMetricCell;
    fid: PageSpeedMetricCell;
    cls: PageSpeedMetricCell;
    fcp: PageSpeedMetricCell;
    tbt: PageSpeedMetricCell;
    si: PageSpeedMetricCell;
    tti: PageSpeedMetricCell;
  };
  fieldData: {
    overallCategory: string | null;
    metrics: Record<string, unknown> | null;
  } | null;
  timestamp: string;
  url: string | undefined;
};

/**
 * Latest PageSpeed Insights result per site (desktop + mobile).
 * Served from Postgres until the user manually runs the test again.
 */
export const pagespeedInsightCache = pgTable(
  "pagespeed_insight_cache",
  {
    id: text("id").primaryKey(),
    /** Normalized site origin, e.g. https://example.com */
    siteUrl: text("site_url").notNull(),
    desktop: jsonb("desktop").$type<PageSpeedFormattedResult | null>(),
    mobile: jsonb("mobile").$type<PageSpeedFormattedResult | null>(),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("pagespeed_insight_cache_siteUrl_uidx").on(table.siteUrl),
  ],
);
