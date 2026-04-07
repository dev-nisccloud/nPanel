import { z } from "zod";
/**
 * SEO Reports API Schemas
 * Re-structured for automated reporting from GSC and GA4.
 */
// ---- Enums ----
export const seoReportStatusSchema = z.enum(["DRAFT", "FINAL"]);
// ---- Automated Report Schemas ----
export const seoAutomatedReportInputSchema = z.object({
    siteId: z.string().min(1, "Site ID is required"),
    ga4PropertyId: z.string().optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format (YYYY-MM-DD)"),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format (YYYY-MM-DD)"),
});
/** GA4-only report input (no GSC site linking). */
export const seoGa4ReportInputSchema = z.object({
    ga4PropertyId: z.string().min(1, "GA4 property ID is required"),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format (YYYY-MM-DD)"),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format (YYYY-MM-DD)"),
});
/** GA4 property for independent listing (no domain matching). */
export const seoGa4PropertySchema = z.object({
    propertyId: z.string(),
    displayName: z.string(),
    defaultUrl: z.string().nullable(),
});
export const seoManageableSiteSchema = z.object({
    siteUrl: z.string(),
    permissionLevel: z.string().nullable().optional(),
    ga4PropertyId: z.string().nullable().optional(),
    ga4DisplayName: z.string().nullable().optional(),
});
export const seoTimeSeriesDataSchema = z.object({
    date: z.string(),
    clicks: z.number().default(0),
    impressions: z.number().default(0),
    sessions: z.number().default(0),
    conversions: z.number().default(0),
    engagementRate: z.number().optional(),
    totalUsers: z.number().optional(),
    bounceRate: z.number().optional(),
    averageSessionDuration: z.number().optional(),
});
export const seoTopKeywordSchema = z.object({
    query: z.string(),
    clicks: z.number(),
    impressions: z.number(),
    ctr: z.number(),
    position: z.number(),
});
export const seoTopCountrySchema = z.object({
    country: z.string(),
    clicks: z.number(),
    impressions: z.number(),
    ctr: z.number(),
    position: z.number(),
});
export const seoTopPageSchema = z.object({
    url: z.string(),
    clicks: z.number().default(0),
    impressions: z.number().default(0),
    ctr: z.number().default(0),
    position: z.number().default(0),
    clicksChange: z.number().optional(),
    sessions: z.number().optional(),
    engagementRate: z.number().optional(),
    conversions: z.number().optional(),
    bounceRate: z.number().optional(),
    averageSessionDuration: z.number().optional(),
});
export const seoDeviceBreakdownSchema = z.object({
    device: z.string(),
    clicks: z.number(),
    impressions: z.number(),
    ctr: z.number(),
    position: z.number(),
});
export const seoSearchAppearanceSchema = z.object({
    appearance: z.string(),
    clicks: z.number(),
    impressions: z.number(),
    ctr: z.number(),
    position: z.number(),
});
export const seoOpportunitySchema = z.object({
    query: z.string(),
    clicks: z.number(),
    impressions: z.number(),
    ctr: z.number(),
    position: z.number(),
    type: z.enum(["PAGE_TWO", "CTR_BOOST"]),
});
export const seoSitemapSchema = z.object({
    path: z.string(),
    lastDownloaded: z.string().optional(),
    lastSubmitted: z.string().optional(),
    errors: z.number(),
    warnings: z.number(),
    status: z.string(),
    type: z.string().optional(),
    issues: z.array(z.string()).default([]),
    indexedUrls: z.number().optional(),
    submittedUrls: z.number().optional(),
});
export const seoAutomatedReportResponseSchema = z.object({
    summary: z.object({
        totalImpressions: z.number(),
        totalImpressionsPrev: z.number(),
        totalClicks: z.number(),
        totalClicksPrev: z.number(),
        averageCtr: z.number(),
        averageCtrPrev: z.number(),
        averagePosition: z.number(),
        averagePositionPrev: z.number(),
        totalSessions: z.number().optional(),
        totalSessionsPrev: z.number().optional(),
        totalUsers: z.number().optional(),
        totalUsersPrev: z.number().optional(),
        averageEngagementRate: z.number().optional(),
        averageEngagementRatePrev: z.number().optional(),
        totalConversions: z.number().optional(),
        totalConversionsPrev: z.number().optional(),
        averageBounceRate: z.number().optional(),
        averageBounceRatePrev: z.number().optional(),
        averageSessionDuration: z.number().optional(),
        averageSessionDurationPrev: z.number().optional(),
    }),
    timeSeries: z.array(seoTimeSeriesDataSchema),
    topKeywords: z.array(seoTopKeywordSchema),
    topPages: z.object({
        top: z.array(seoTopPageSchema),
        trendingUp: z.array(seoTopPageSchema),
        trendingDown: z.array(seoTopPageSchema),
    }),
    topCountries: z.array(seoTopCountrySchema),
    topDevices: z.array(seoDeviceBreakdownSchema).default([]),
    searchAppearance: z.array(seoSearchAppearanceSchema).default([]),
    opportunities: z.object({
        pageTwo: z.array(seoOpportunitySchema).default([]),
        highPotential: z.array(seoOpportunitySchema).default([]),
    }).default({ pageTwo: [], highPotential: [] }),
    sitemaps: z.array(seoSitemapSchema).default([]),
});
/**
 * Legacy Schemas (kept for potential backward compatibility or internal usage)
 */
const optStr = () => z.string().optional();
export const seoReportCreateInputSchema = z.object({
    teamId: z.string().optional().nullable(),
    reportName: z.string().min(1, "Report name is required"),
    reportMonth: z.string().min(1, "Month is required"),
    reportYear: z.string().min(1, "Year is required"),
    websiteUrl: optStr().nullable(),
    status: seoReportStatusSchema.optional(),
    recommendations: optStr(),
    sessions: optStr(),
    totalWebTraffic: optStr(),
    totalViews: optStr(),
    bounceRate: optStr(),
    users: optStr(),
    returningUsers: optStr(),
    eventCount: optStr(),
    conversions: optStr(),
    sessionDuration: optStr(),
    engagedSessions: optStr(),
    sessionsDesktop: optStr(),
    sessionsMobile: optStr(),
    sessionsTablet: optStr(),
    formSubmissions: optStr(),
    impressions: optStr(),
    clicks: optStr(),
});
export const seoReportUpdateInputSchema = seoReportCreateInputSchema.extend({
    id: z.string().min(1),
}).partial().required({ id: true });
export const seoReportListFiltersSchema = z.object({
    teamId: z.string().optional(),
    status: seoReportStatusSchema.optional(),
    reportName: z.string().optional(),
    reportYear: z.string().optional(),
    reportMonth: z.string().optional(),
    search: z.string().optional(),
    limit: z.number().int().min(1).max(100).optional().default(50),
    offset: z.number().int().min(0).optional().default(0),
});
export const seoReportSummarySchema = z.object({
    id: z.string(),
    reportName: z.string(),
    reportMonth: z.string(),
    reportYear: z.string(),
    websiteUrl: z.string().nullable(),
    status: seoReportStatusSchema,
    teamId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    sessions: z.string().nullable(),
    totalWebTraffic: z.string().nullable(),
    bounceRate: z.string().nullable(),
    impressions: z.string().nullable(),
    clicks: z.string().nullable(),
    conversions: z.string().nullable(),
});
export const seoReportDetailSchema = z.object({
    id: z.string(),
    userId: z.string(),
    teamId: z.string().nullable(),
    reportName: z.string(),
    reportMonth: z.string(),
    reportYear: z.string(),
    websiteUrl: z.string().nullable(),
    status: seoReportStatusSchema,
    recommendations: z.string().nullable(),
    sessions: z.string().nullable(),
    totalWebTraffic: z.string().nullable(),
    totalViews: z.string().nullable(),
    bounceRate: z.string().nullable(),
    users: z.string().nullable(),
    returningUsers: z.string().nullable(),
    eventCount: z.string().nullable(),
    conversions: z.string().nullable(),
    sessionDuration: z.string().nullable(),
    engagedSessions: z.string().nullable(),
    sessionsDesktop: z.string().nullable(),
    sessionsMobile: z.string().nullable(),
    sessionsTablet: z.string().nullable(),
    formSubmissions: z.string().nullable(),
    impressions: z.string().nullable(),
    clicks: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const seoReportListResponseSchema = z.object({
    reports: z.array(seoReportSummarySchema),
    total: z.number().int().nonnegative(),
});
