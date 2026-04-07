import { type Context } from "../../trpc";
export declare const seoReportsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getAutomatedReport: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            siteId: string;
            from: string;
            to: string;
            ga4PropertyId?: string | undefined;
        };
        output: {
            summary: {
                totalImpressions: number;
                totalImpressionsPrev: number;
                totalClicks: number;
                totalClicksPrev: number;
                averageCtr: number;
                averageCtrPrev: number;
                averagePosition: number;
                averagePositionPrev: number;
                totalSessions?: number | undefined;
                totalSessionsPrev?: number | undefined;
                totalUsers?: number | undefined;
                totalUsersPrev?: number | undefined;
                averageEngagementRate?: number | undefined;
                averageEngagementRatePrev?: number | undefined;
                totalConversions?: number | undefined;
                totalConversionsPrev?: number | undefined;
                averageBounceRate?: number | undefined;
                averageBounceRatePrev?: number | undefined;
                averageSessionDuration?: number | undefined;
                averageSessionDurationPrev?: number | undefined;
            };
            timeSeries: {
                date: string;
                clicks: number;
                impressions: number;
                sessions: number;
                conversions: number;
                engagementRate?: number | undefined;
                totalUsers?: number | undefined;
                bounceRate?: number | undefined;
                averageSessionDuration?: number | undefined;
            }[];
            topKeywords: {
                query: string;
                clicks: number;
                impressions: number;
                ctr: number;
                position: number;
            }[];
            topPages: {
                top: {
                    url: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                    clicksChange?: number | undefined;
                    sessions?: number | undefined;
                    engagementRate?: number | undefined;
                    conversions?: number | undefined;
                    bounceRate?: number | undefined;
                    averageSessionDuration?: number | undefined;
                }[];
                trendingUp: {
                    url: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                    clicksChange?: number | undefined;
                    sessions?: number | undefined;
                    engagementRate?: number | undefined;
                    conversions?: number | undefined;
                    bounceRate?: number | undefined;
                    averageSessionDuration?: number | undefined;
                }[];
                trendingDown: {
                    url: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                    clicksChange?: number | undefined;
                    sessions?: number | undefined;
                    engagementRate?: number | undefined;
                    conversions?: number | undefined;
                    bounceRate?: number | undefined;
                    averageSessionDuration?: number | undefined;
                }[];
            };
            topCountries: {
                country: string;
                clicks: number;
                impressions: number;
                ctr: number;
                position: number;
            }[];
            topDevices: {
                device: string;
                clicks: number;
                impressions: number;
                ctr: number;
                position: number;
            }[];
            searchAppearance: {
                appearance: string;
                clicks: number;
                impressions: number;
                ctr: number;
                position: number;
            }[];
            opportunities: {
                pageTwo: {
                    query: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                    type: "PAGE_TWO" | "CTR_BOOST";
                }[];
                highPotential: {
                    query: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                    type: "PAGE_TWO" | "CTR_BOOST";
                }[];
            };
            sitemaps: {
                path: string;
                errors: number;
                warnings: number;
                status: string;
                issues: string[];
                lastDownloaded?: string | undefined;
                lastSubmitted?: string | undefined;
                type?: string | undefined;
                indexedUrls?: number | undefined;
                submittedUrls?: number | undefined;
            }[];
        };
        meta: object;
    }>;
    listManageableSites: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            siteUrl: string;
            permissionLevel?: string | null | undefined;
            ga4PropertyId?: string | null | undefined;
            ga4DisplayName?: string | null | undefined;
        }[];
        meta: object;
    }>;
    /** List GA4 properties independently (no GSC domain matching). User selects which property to view. */
    listGa4Properties: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            propertyId: string;
            displayName: string;
            defaultUrl: string | null;
        }[];
        meta: object;
    }>;
    /** GA4-only report: no GSC linking. Use when user selects a GA4 property directly. */
    getGa4Report: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            ga4PropertyId: string;
            from: string;
            to: string;
        };
        output: {
            summary: {
                totalImpressions: number;
                totalImpressionsPrev: number;
                totalClicks: number;
                totalClicksPrev: number;
                averageCtr: number;
                averageCtrPrev: number;
                averagePosition: number;
                averagePositionPrev: number;
                totalSessions?: number | undefined;
                totalSessionsPrev?: number | undefined;
                totalUsers?: number | undefined;
                totalUsersPrev?: number | undefined;
                averageEngagementRate?: number | undefined;
                averageEngagementRatePrev?: number | undefined;
                totalConversions?: number | undefined;
                totalConversionsPrev?: number | undefined;
                averageBounceRate?: number | undefined;
                averageBounceRatePrev?: number | undefined;
                averageSessionDuration?: number | undefined;
                averageSessionDurationPrev?: number | undefined;
            };
            timeSeries: {
                date: string;
                clicks: number;
                impressions: number;
                sessions: number;
                conversions: number;
                engagementRate?: number | undefined;
                totalUsers?: number | undefined;
                bounceRate?: number | undefined;
                averageSessionDuration?: number | undefined;
            }[];
            topKeywords: {
                query: string;
                clicks: number;
                impressions: number;
                ctr: number;
                position: number;
            }[];
            topPages: {
                top: {
                    url: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                    clicksChange?: number | undefined;
                    sessions?: number | undefined;
                    engagementRate?: number | undefined;
                    conversions?: number | undefined;
                    bounceRate?: number | undefined;
                    averageSessionDuration?: number | undefined;
                }[];
                trendingUp: {
                    url: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                    clicksChange?: number | undefined;
                    sessions?: number | undefined;
                    engagementRate?: number | undefined;
                    conversions?: number | undefined;
                    bounceRate?: number | undefined;
                    averageSessionDuration?: number | undefined;
                }[];
                trendingDown: {
                    url: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                    clicksChange?: number | undefined;
                    sessions?: number | undefined;
                    engagementRate?: number | undefined;
                    conversions?: number | undefined;
                    bounceRate?: number | undefined;
                    averageSessionDuration?: number | undefined;
                }[];
            };
            topCountries: {
                country: string;
                clicks: number;
                impressions: number;
                ctr: number;
                position: number;
            }[];
            topDevices: {
                device: string;
                clicks: number;
                impressions: number;
                ctr: number;
                position: number;
            }[];
            searchAppearance: {
                appearance: string;
                clicks: number;
                impressions: number;
                ctr: number;
                position: number;
            }[];
            opportunities: {
                pageTwo: {
                    query: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                    type: "PAGE_TWO" | "CTR_BOOST";
                }[];
                highPotential: {
                    query: string;
                    clicks: number;
                    impressions: number;
                    ctr: number;
                    position: number;
                    type: "PAGE_TWO" | "CTR_BOOST";
                }[];
            };
            sitemaps: {
                path: string;
                errors: number;
                warnings: number;
                status: string;
                issues: string[];
                lastDownloaded?: string | undefined;
                lastSubmitted?: string | undefined;
                type?: string | undefined;
                indexedUrls?: number | undefined;
                submittedUrls?: number | undefined;
            }[];
        };
        meta: object;
    }>;
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            teamId?: string | undefined;
            status?: "DRAFT" | "FINAL" | undefined;
            reportName?: string | undefined;
            reportYear?: string | undefined;
            reportMonth?: string | undefined;
            search?: string | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            reports: {
                id: string;
                reportName: string;
                reportMonth: string;
                reportYear: string;
                websiteUrl: string | null;
                status: "DRAFT" | "FINAL";
                teamId: string | null;
                createdAt: Date;
                updatedAt: Date;
                sessions: string | null;
                totalWebTraffic: string | null;
                bounceRate: string | null;
                impressions: string | null;
                clicks: string | null;
                conversions: string | null;
            }[];
            total: number;
        };
        meta: object;
    }>;
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            userId: string;
            teamId: string | null;
            reportName: string;
            reportMonth: string;
            reportYear: string;
            websiteUrl: string | null;
            status: "DRAFT" | "FINAL";
            recommendations: string | null;
            sessions: string | null;
            totalWebTraffic: string | null;
            totalViews: string | null;
            bounceRate: string | null;
            users: string | null;
            returningUsers: string | null;
            eventCount: string | null;
            conversions: string | null;
            sessionDuration: string | null;
            engagedSessions: string | null;
            sessionsDesktop: string | null;
            sessionsMobile: string | null;
            sessionsTablet: string | null;
            formSubmissions: string | null;
            impressions: string | null;
            clicks: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            reportName: string;
            reportMonth: string;
            reportYear: string;
            teamId?: string | null | undefined;
            websiteUrl?: string | null | undefined;
            status?: "DRAFT" | "FINAL" | undefined;
            recommendations?: string | undefined;
            sessions?: string | undefined;
            totalWebTraffic?: string | undefined;
            totalViews?: string | undefined;
            bounceRate?: string | undefined;
            users?: string | undefined;
            returningUsers?: string | undefined;
            eventCount?: string | undefined;
            conversions?: string | undefined;
            sessionDuration?: string | undefined;
            engagedSessions?: string | undefined;
            sessionsDesktop?: string | undefined;
            sessionsMobile?: string | undefined;
            sessionsTablet?: string | undefined;
            formSubmissions?: string | undefined;
            impressions?: string | undefined;
            clicks?: string | undefined;
        };
        output: {
            id: string;
            userId: string;
            teamId: string | null;
            reportName: string;
            reportMonth: string;
            reportYear: string;
            websiteUrl: string | null;
            status: "DRAFT" | "FINAL";
            recommendations: string | null;
            sessions: string | null;
            totalWebTraffic: string | null;
            totalViews: string | null;
            bounceRate: string | null;
            users: string | null;
            returningUsers: string | null;
            eventCount: string | null;
            conversions: string | null;
            sessionDuration: string | null;
            engagedSessions: string | null;
            sessionsDesktop: string | null;
            sessionsMobile: string | null;
            sessionsTablet: string | null;
            formSubmissions: string | null;
            impressions: string | null;
            clicks: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
}>>;
