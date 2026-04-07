import { z } from "zod";
/**
 * SEO Reports API Schemas
 * Re-structured for automated reporting from GSC and GA4.
 */
export declare const seoReportStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    FINAL: "FINAL";
}>;
export type SeoReportStatus = z.infer<typeof seoReportStatusSchema>;
export declare const seoAutomatedReportInputSchema: z.ZodObject<{
    siteId: z.ZodString;
    ga4PropertyId: z.ZodOptional<z.ZodString>;
    from: z.ZodString;
    to: z.ZodString;
}, z.core.$strip>;
/** GA4-only report input (no GSC site linking). */
export declare const seoGa4ReportInputSchema: z.ZodObject<{
    ga4PropertyId: z.ZodString;
    from: z.ZodString;
    to: z.ZodString;
}, z.core.$strip>;
/** GA4 property for independent listing (no domain matching). */
export declare const seoGa4PropertySchema: z.ZodObject<{
    propertyId: z.ZodString;
    displayName: z.ZodString;
    defaultUrl: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type SeoGa4Property = z.infer<typeof seoGa4PropertySchema>;
export declare const seoManageableSiteSchema: z.ZodObject<{
    siteUrl: z.ZodString;
    permissionLevel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ga4PropertyId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ga4DisplayName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export type SeoManageableSite = z.infer<typeof seoManageableSiteSchema>;
export declare const seoTimeSeriesDataSchema: z.ZodObject<{
    date: z.ZodString;
    clicks: z.ZodDefault<z.ZodNumber>;
    impressions: z.ZodDefault<z.ZodNumber>;
    sessions: z.ZodDefault<z.ZodNumber>;
    conversions: z.ZodDefault<z.ZodNumber>;
    engagementRate: z.ZodOptional<z.ZodNumber>;
    totalUsers: z.ZodOptional<z.ZodNumber>;
    bounceRate: z.ZodOptional<z.ZodNumber>;
    averageSessionDuration: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const seoTopKeywordSchema: z.ZodObject<{
    query: z.ZodString;
    clicks: z.ZodNumber;
    impressions: z.ZodNumber;
    ctr: z.ZodNumber;
    position: z.ZodNumber;
}, z.core.$strip>;
export declare const seoTopCountrySchema: z.ZodObject<{
    country: z.ZodString;
    clicks: z.ZodNumber;
    impressions: z.ZodNumber;
    ctr: z.ZodNumber;
    position: z.ZodNumber;
}, z.core.$strip>;
export declare const seoTopPageSchema: z.ZodObject<{
    url: z.ZodString;
    clicks: z.ZodDefault<z.ZodNumber>;
    impressions: z.ZodDefault<z.ZodNumber>;
    ctr: z.ZodDefault<z.ZodNumber>;
    position: z.ZodDefault<z.ZodNumber>;
    clicksChange: z.ZodOptional<z.ZodNumber>;
    sessions: z.ZodOptional<z.ZodNumber>;
    engagementRate: z.ZodOptional<z.ZodNumber>;
    conversions: z.ZodOptional<z.ZodNumber>;
    bounceRate: z.ZodOptional<z.ZodNumber>;
    averageSessionDuration: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const seoDeviceBreakdownSchema: z.ZodObject<{
    device: z.ZodString;
    clicks: z.ZodNumber;
    impressions: z.ZodNumber;
    ctr: z.ZodNumber;
    position: z.ZodNumber;
}, z.core.$strip>;
export declare const seoSearchAppearanceSchema: z.ZodObject<{
    appearance: z.ZodString;
    clicks: z.ZodNumber;
    impressions: z.ZodNumber;
    ctr: z.ZodNumber;
    position: z.ZodNumber;
}, z.core.$strip>;
export declare const seoOpportunitySchema: z.ZodObject<{
    query: z.ZodString;
    clicks: z.ZodNumber;
    impressions: z.ZodNumber;
    ctr: z.ZodNumber;
    position: z.ZodNumber;
    type: z.ZodEnum<{
        PAGE_TWO: "PAGE_TWO";
        CTR_BOOST: "CTR_BOOST";
    }>;
}, z.core.$strip>;
export declare const seoSitemapSchema: z.ZodObject<{
    path: z.ZodString;
    lastDownloaded: z.ZodOptional<z.ZodString>;
    lastSubmitted: z.ZodOptional<z.ZodString>;
    errors: z.ZodNumber;
    warnings: z.ZodNumber;
    status: z.ZodString;
    type: z.ZodOptional<z.ZodString>;
    issues: z.ZodDefault<z.ZodArray<z.ZodString>>;
    indexedUrls: z.ZodOptional<z.ZodNumber>;
    submittedUrls: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const seoAutomatedReportResponseSchema: z.ZodObject<{
    summary: z.ZodObject<{
        totalImpressions: z.ZodNumber;
        totalImpressionsPrev: z.ZodNumber;
        totalClicks: z.ZodNumber;
        totalClicksPrev: z.ZodNumber;
        averageCtr: z.ZodNumber;
        averageCtrPrev: z.ZodNumber;
        averagePosition: z.ZodNumber;
        averagePositionPrev: z.ZodNumber;
        totalSessions: z.ZodOptional<z.ZodNumber>;
        totalSessionsPrev: z.ZodOptional<z.ZodNumber>;
        totalUsers: z.ZodOptional<z.ZodNumber>;
        totalUsersPrev: z.ZodOptional<z.ZodNumber>;
        averageEngagementRate: z.ZodOptional<z.ZodNumber>;
        averageEngagementRatePrev: z.ZodOptional<z.ZodNumber>;
        totalConversions: z.ZodOptional<z.ZodNumber>;
        totalConversionsPrev: z.ZodOptional<z.ZodNumber>;
        averageBounceRate: z.ZodOptional<z.ZodNumber>;
        averageBounceRatePrev: z.ZodOptional<z.ZodNumber>;
        averageSessionDuration: z.ZodOptional<z.ZodNumber>;
        averageSessionDurationPrev: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
    timeSeries: z.ZodArray<z.ZodObject<{
        date: z.ZodString;
        clicks: z.ZodDefault<z.ZodNumber>;
        impressions: z.ZodDefault<z.ZodNumber>;
        sessions: z.ZodDefault<z.ZodNumber>;
        conversions: z.ZodDefault<z.ZodNumber>;
        engagementRate: z.ZodOptional<z.ZodNumber>;
        totalUsers: z.ZodOptional<z.ZodNumber>;
        bounceRate: z.ZodOptional<z.ZodNumber>;
        averageSessionDuration: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    topKeywords: z.ZodArray<z.ZodObject<{
        query: z.ZodString;
        clicks: z.ZodNumber;
        impressions: z.ZodNumber;
        ctr: z.ZodNumber;
        position: z.ZodNumber;
    }, z.core.$strip>>;
    topPages: z.ZodObject<{
        top: z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            clicks: z.ZodDefault<z.ZodNumber>;
            impressions: z.ZodDefault<z.ZodNumber>;
            ctr: z.ZodDefault<z.ZodNumber>;
            position: z.ZodDefault<z.ZodNumber>;
            clicksChange: z.ZodOptional<z.ZodNumber>;
            sessions: z.ZodOptional<z.ZodNumber>;
            engagementRate: z.ZodOptional<z.ZodNumber>;
            conversions: z.ZodOptional<z.ZodNumber>;
            bounceRate: z.ZodOptional<z.ZodNumber>;
            averageSessionDuration: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        trendingUp: z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            clicks: z.ZodDefault<z.ZodNumber>;
            impressions: z.ZodDefault<z.ZodNumber>;
            ctr: z.ZodDefault<z.ZodNumber>;
            position: z.ZodDefault<z.ZodNumber>;
            clicksChange: z.ZodOptional<z.ZodNumber>;
            sessions: z.ZodOptional<z.ZodNumber>;
            engagementRate: z.ZodOptional<z.ZodNumber>;
            conversions: z.ZodOptional<z.ZodNumber>;
            bounceRate: z.ZodOptional<z.ZodNumber>;
            averageSessionDuration: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        trendingDown: z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            clicks: z.ZodDefault<z.ZodNumber>;
            impressions: z.ZodDefault<z.ZodNumber>;
            ctr: z.ZodDefault<z.ZodNumber>;
            position: z.ZodDefault<z.ZodNumber>;
            clicksChange: z.ZodOptional<z.ZodNumber>;
            sessions: z.ZodOptional<z.ZodNumber>;
            engagementRate: z.ZodOptional<z.ZodNumber>;
            conversions: z.ZodOptional<z.ZodNumber>;
            bounceRate: z.ZodOptional<z.ZodNumber>;
            averageSessionDuration: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    topCountries: z.ZodArray<z.ZodObject<{
        country: z.ZodString;
        clicks: z.ZodNumber;
        impressions: z.ZodNumber;
        ctr: z.ZodNumber;
        position: z.ZodNumber;
    }, z.core.$strip>>;
    topDevices: z.ZodDefault<z.ZodArray<z.ZodObject<{
        device: z.ZodString;
        clicks: z.ZodNumber;
        impressions: z.ZodNumber;
        ctr: z.ZodNumber;
        position: z.ZodNumber;
    }, z.core.$strip>>>;
    searchAppearance: z.ZodDefault<z.ZodArray<z.ZodObject<{
        appearance: z.ZodString;
        clicks: z.ZodNumber;
        impressions: z.ZodNumber;
        ctr: z.ZodNumber;
        position: z.ZodNumber;
    }, z.core.$strip>>>;
    opportunities: z.ZodDefault<z.ZodObject<{
        pageTwo: z.ZodDefault<z.ZodArray<z.ZodObject<{
            query: z.ZodString;
            clicks: z.ZodNumber;
            impressions: z.ZodNumber;
            ctr: z.ZodNumber;
            position: z.ZodNumber;
            type: z.ZodEnum<{
                PAGE_TWO: "PAGE_TWO";
                CTR_BOOST: "CTR_BOOST";
            }>;
        }, z.core.$strip>>>;
        highPotential: z.ZodDefault<z.ZodArray<z.ZodObject<{
            query: z.ZodString;
            clicks: z.ZodNumber;
            impressions: z.ZodNumber;
            ctr: z.ZodNumber;
            position: z.ZodNumber;
            type: z.ZodEnum<{
                PAGE_TWO: "PAGE_TWO";
                CTR_BOOST: "CTR_BOOST";
            }>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    sitemaps: z.ZodDefault<z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        lastDownloaded: z.ZodOptional<z.ZodString>;
        lastSubmitted: z.ZodOptional<z.ZodString>;
        errors: z.ZodNumber;
        warnings: z.ZodNumber;
        status: z.ZodString;
        type: z.ZodOptional<z.ZodString>;
        issues: z.ZodDefault<z.ZodArray<z.ZodString>>;
        indexedUrls: z.ZodOptional<z.ZodNumber>;
        submittedUrls: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const seoReportCreateInputSchema: z.ZodObject<{
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reportName: z.ZodString;
    reportMonth: z.ZodString;
    reportYear: z.ZodString;
    websiteUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        DRAFT: "DRAFT";
        FINAL: "FINAL";
    }>>;
    recommendations: z.ZodOptional<z.ZodString>;
    sessions: z.ZodOptional<z.ZodString>;
    totalWebTraffic: z.ZodOptional<z.ZodString>;
    totalViews: z.ZodOptional<z.ZodString>;
    bounceRate: z.ZodOptional<z.ZodString>;
    users: z.ZodOptional<z.ZodString>;
    returningUsers: z.ZodOptional<z.ZodString>;
    eventCount: z.ZodOptional<z.ZodString>;
    conversions: z.ZodOptional<z.ZodString>;
    sessionDuration: z.ZodOptional<z.ZodString>;
    engagedSessions: z.ZodOptional<z.ZodString>;
    sessionsDesktop: z.ZodOptional<z.ZodString>;
    sessionsMobile: z.ZodOptional<z.ZodString>;
    sessionsTablet: z.ZodOptional<z.ZodString>;
    formSubmissions: z.ZodOptional<z.ZodString>;
    impressions: z.ZodOptional<z.ZodString>;
    clicks: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const seoReportUpdateInputSchema: z.ZodObject<{
    teamId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    reportName: z.ZodOptional<z.ZodString>;
    reportMonth: z.ZodOptional<z.ZodString>;
    reportYear: z.ZodOptional<z.ZodString>;
    websiteUrl: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        DRAFT: "DRAFT";
        FINAL: "FINAL";
    }>>>;
    recommendations: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sessions: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    totalWebTraffic: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    totalViews: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    bounceRate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    users: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    returningUsers: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    eventCount: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    conversions: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sessionDuration: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    engagedSessions: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sessionsDesktop: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sessionsMobile: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sessionsTablet: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    formSubmissions: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    impressions: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    clicks: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    id: z.ZodNonOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const seoReportListFiltersSchema: z.ZodObject<{
    teamId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        DRAFT: "DRAFT";
        FINAL: "FINAL";
    }>>;
    reportName: z.ZodOptional<z.ZodString>;
    reportYear: z.ZodOptional<z.ZodString>;
    reportMonth: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export declare const seoReportSummarySchema: z.ZodObject<{
    id: z.ZodString;
    reportName: z.ZodString;
    reportMonth: z.ZodString;
    reportYear: z.ZodString;
    websiteUrl: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        FINAL: "FINAL";
    }>;
    teamId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    sessions: z.ZodNullable<z.ZodString>;
    totalWebTraffic: z.ZodNullable<z.ZodString>;
    bounceRate: z.ZodNullable<z.ZodString>;
    impressions: z.ZodNullable<z.ZodString>;
    clicks: z.ZodNullable<z.ZodString>;
    conversions: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const seoReportDetailSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    teamId: z.ZodNullable<z.ZodString>;
    reportName: z.ZodString;
    reportMonth: z.ZodString;
    reportYear: z.ZodString;
    websiteUrl: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        FINAL: "FINAL";
    }>;
    recommendations: z.ZodNullable<z.ZodString>;
    sessions: z.ZodNullable<z.ZodString>;
    totalWebTraffic: z.ZodNullable<z.ZodString>;
    totalViews: z.ZodNullable<z.ZodString>;
    bounceRate: z.ZodNullable<z.ZodString>;
    users: z.ZodNullable<z.ZodString>;
    returningUsers: z.ZodNullable<z.ZodString>;
    eventCount: z.ZodNullable<z.ZodString>;
    conversions: z.ZodNullable<z.ZodString>;
    sessionDuration: z.ZodNullable<z.ZodString>;
    engagedSessions: z.ZodNullable<z.ZodString>;
    sessionsDesktop: z.ZodNullable<z.ZodString>;
    sessionsMobile: z.ZodNullable<z.ZodString>;
    sessionsTablet: z.ZodNullable<z.ZodString>;
    formSubmissions: z.ZodNullable<z.ZodString>;
    impressions: z.ZodNullable<z.ZodString>;
    clicks: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
export type SeoReportDetail = z.infer<typeof seoReportDetailSchema>;
export declare const seoReportListResponseSchema: z.ZodObject<{
    reports: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        reportName: z.ZodString;
        reportMonth: z.ZodString;
        reportYear: z.ZodString;
        websiteUrl: z.ZodNullable<z.ZodString>;
        status: z.ZodEnum<{
            DRAFT: "DRAFT";
            FINAL: "FINAL";
        }>;
        teamId: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        sessions: z.ZodNullable<z.ZodString>;
        totalWebTraffic: z.ZodNullable<z.ZodString>;
        bounceRate: z.ZodNullable<z.ZodString>;
        impressions: z.ZodNullable<z.ZodString>;
        clicks: z.ZodNullable<z.ZodString>;
        conversions: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
