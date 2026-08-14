import { type Context } from "../../trpc";
export declare const seoSuiteRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    credentialsStatus: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            configured: boolean;
        };
        meta: object;
    }>;
    listProjects: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            search?: string | undefined;
        } | undefined;
        output: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            createdById: string;
            teamId: string | null;
            primaryDomain: string;
            locationCode: number;
            locationName: string;
            languageCode: string;
            brandEntities: string[];
            competitorDomains: string[];
            gscSiteId: string | null;
            ga4PropertyId: string | null;
            archivedAt: Date | null;
        }[];
        meta: object;
    }>;
    getProject: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            createdById: string;
            teamId: string | null;
            primaryDomain: string;
            locationCode: number;
            locationName: string;
            languageCode: string;
            brandEntities: string[];
            competitorDomains: string[];
            gscSiteId: string | null;
            ga4PropertyId: string | null;
            archivedAt: Date | null;
        };
        meta: object;
    }>;
    createProject: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            primaryDomain: string;
            locationCode?: number | undefined;
            locationName?: string | undefined;
            languageCode?: string | undefined;
            brandEntities?: string[] | undefined;
            competitorDomains?: string[] | undefined;
            teamId?: string | null | undefined;
            gscSiteId?: string | null | undefined;
            ga4PropertyId?: string | null | undefined;
        };
        output: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            createdById: string;
            teamId: string | null;
            primaryDomain: string;
            locationCode: number;
            locationName: string;
            languageCode: string;
            brandEntities: string[];
            competitorDomains: string[];
            gscSiteId: string | null;
            ga4PropertyId: string | null;
            archivedAt: Date | null;
        };
        meta: object;
    }>;
    updateProject: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            name?: string | undefined;
            primaryDomain?: string | undefined;
            locationCode?: number | undefined;
            locationName?: string | undefined;
            languageCode?: string | undefined;
            brandEntities?: string[] | undefined;
            competitorDomains?: string[] | undefined;
            teamId?: string | null | undefined;
            gscSiteId?: string | null | undefined;
            ga4PropertyId?: string | null | undefined;
        };
        output: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            createdById: string;
            teamId: string | null;
            primaryDomain: string;
            locationCode: number;
            locationName: string;
            languageCode: string;
            brandEntities: string[];
            competitorDomains: string[];
            gscSiteId: string | null;
            ga4PropertyId: string | null;
            archivedAt: Date | null;
        };
        meta: object;
    }>;
    archiveProject: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            ok: boolean;
        };
        meta: object;
    }>;
    keywordResearch: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            mode: "suggestions" | "ideas" | "related" | "for_site";
            seeds: string[];
            limit?: number | undefined;
        };
        output: {
            items: unknown[];
            mode: "suggestions" | "ideas" | "related" | "for_site";
        };
        meta: object;
    }>;
    keywordOverview: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            keyword: string;
        };
        output: {} | null;
        meta: object;
    }>;
    domainOverview: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            target?: string | undefined;
            includeSubdomains?: boolean | undefined;
        };
        output: {
            metrics: import("../../lib/dataforseo/mappers").DomainOverviewMetrics;
            rankedKeywords: import("../../lib/dataforseo/mappers").RankedKeywordResult[];
            pages: import("../../lib/dataforseo/mappers").PageResult[];
        };
        meta: object;
    }>;
    latestDomainSnapshot: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            metrics: any;
            rankedKeywords: {
                keyword: string;
                position: number | null;
                searchVolume: number | null;
                traffic: number | null;
                cpc: number | null;
                keywordDifficulty: number | null;
                url: string | null;
            }[];
            pages: {
                pageAddress: string;
                keywordCount: number | null;
                traffic: number | null;
            }[];
            id: string;
            payload: unknown;
            target: string;
            projectId: string;
            capturedAt: Date;
            organicTraffic: number | null;
            organicKeywords: number | null;
            pos1Count: number | null;
            pos2_3Count: number | null;
            pos4_10Count: number | null;
            pos11_20Count: number | null;
            hasData: number;
        } | null;
        meta: object;
    }>;
    competitorsDomain: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            limit?: number | undefined;
        };
        output: {
            items: {} | null;
        };
        meta: object;
    }>;
    keywordGap: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            competitor: string;
            intersections?: boolean | undefined;
            limit?: number | undefined;
        };
        output: {
            items: {} | null;
            competitor: string;
        };
        meta: object;
    }>;
    linkGap: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            competitors: string[];
        };
        output: {
            items: {} | null;
        };
        meta: object;
    }>;
    backlinksSummary: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            target?: string | undefined;
        };
        output: {} | null;
        meta: object;
    }>;
    backlinksList: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            mode: "referring_domains" | "backlinks" | "anchors";
            target?: string | undefined;
            limit?: number | undefined;
        };
        output: {
            items: {} | null;
            mode: "referring_domains" | "backlinks" | "anchors";
        };
        meta: object;
    }>;
    latestBacklinkSnapshot: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            summary: unknown;
            target: string;
            projectId: string;
            capturedAt: Date;
        } | null;
        meta: object;
    }>;
    serpLive: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            keyword: string;
            device?: "desktop" | "mobile" | undefined;
        };
        output: {} | null;
        meta: object;
    }>;
    listKeywordLists: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            projectId: string;
        }[];
        meta: object;
    }>;
    createKeywordList: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            name: string;
            description?: string | undefined;
        };
        output: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            projectId: string;
        } | undefined;
        meta: object;
    }>;
    listSavedKeywords: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
            listId?: string | undefined;
        };
        output: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            source: string;
            tags: string[];
            locationCode: number | null;
            languageCode: string | null;
            projectId: string;
            listId: string | null;
            keyword: string;
            metricsCache: unknown;
        }[];
        meta: object;
    }>;
    saveKeywords: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            keywords: string[];
            listId?: string | null | undefined;
            source?: string | undefined;
            status?: string | undefined;
        };
        output: {
            count: number;
        };
        meta: object;
    }>;
    deleteSavedKeyword: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            projectId: string;
        };
        output: {
            ok: boolean;
        };
        meta: object;
    }>;
    getRankTracker: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            tracker: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                locationCode: number;
                languageCode: string;
                projectId: string;
                schedule: string;
                device: string;
                engine: string;
                enabled: boolean;
                lastRunAt: Date | null;
                nextRunAt: Date | null;
            };
            keywords: {
                id: string;
                createdAt: Date;
                tags: string[];
                projectId: string;
                keyword: string;
                trackerId: string;
            }[];
        } | null;
        meta: object;
    }>;
    addRankKeywords: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            keywords: string[];
        };
        output: {
            ok: boolean;
        };
        meta: object;
    }>;
    updateRankTracker: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            schedule?: "weekly" | "daily" | "every_3_days" | undefined;
            device?: "desktop" | "mobile" | undefined;
            enabled?: boolean | undefined;
        };
        output: {
            ok: boolean;
        };
        meta: object;
    }>;
    runRankCheck: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
        };
        output: {
            ok: boolean;
            queued: boolean;
        };
        meta: object;
    }>;
    listRankResults: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
            rankKeywordId?: string | undefined;
            limit?: number | undefined;
        };
        output: {
            id: string;
            url: string | null;
            projectId: string;
            rankKeywordId: string;
            checkedAt: Date;
            rankAbsolute: number | null;
            rankGroup: number | null;
            serpFeatures: string[];
            aiOverview: boolean;
            serpSnapshot: unknown;
        }[];
        meta: object;
    }>;
    listAuditRuns: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            status: string;
            createdAt: Date;
            completedAt: Date | null;
            summary: unknown;
            startedAt: Date | null;
            errorMessage: string | null;
            projectId: string;
            targetUrl: string;
            maxPages: number;
            vendorTaskId: string | null;
            score: number | null;
        }[];
        meta: object;
    }>;
    startAudit: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            targetUrl?: string | undefined;
            maxPages?: number | undefined;
        };
        output: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            queued: boolean;
        };
        meta: object;
    }>;
    getAuditRun: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
            auditRunId: string;
        };
        output: {
            run: {
                id: string;
                status: string;
                createdAt: Date;
                completedAt: Date | null;
                summary: unknown;
                startedAt: Date | null;
                errorMessage: string | null;
                projectId: string;
                targetUrl: string;
                maxPages: number;
                vendorTaskId: string | null;
                score: number | null;
            };
            issues: {
                id: string;
                description: string | null;
                category: string;
                title: string;
                url: string | null;
                projectId: string;
                auditRunId: string;
                severity: string;
                evidence: unknown;
            }[];
            pages: {
                id: string;
                url: string;
                projectId: string;
                score: number | null;
                auditRunId: string;
                statusCode: number | null;
                metrics: unknown;
            }[];
        };
        meta: object;
    }>;
    instantPageAudit: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            url: string;
        };
        output: {} | null;
        meta: object;
    }>;
    listAiEntities: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            createdAt: Date;
            value: string;
            projectId: string;
            entityType: string;
        }[];
        meta: object;
    }>;
    upsertAiEntities: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            entities: {
                entityType: string;
                value: string;
            }[];
        };
        output: {
            ok: boolean;
        };
        meta: object;
    }>;
    refreshAiVisibility: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            platform?: "google" | "chat_gpt" | undefined;
        };
        output: {
            items: unknown[] | null;
        };
        meta: object;
    }>;
    latestAiMentionSnapshot: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            payload: unknown;
            platform: string | null;
            projectId: string;
            capturedAt: Date;
        } | null;
        meta: object;
    }>;
    runPromptExplorer: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            prompt: string;
            models: ("gemini" | "chatgpt" | "claude" | "perplexity")[];
            confirmCost: true;
        };
        output: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            results: Record<string, unknown>;
        };
        meta: object;
    }>;
    listPromptRuns: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            createdAt: Date;
            prompt: string;
            projectId: string;
            models: string[];
            results: unknown;
        }[];
        meta: object;
    }>;
    listTrackedPrompts: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            createdAt: Date;
            prompt: string;
            tags: string[];
            projectId: string;
        }[];
        meta: object;
    }>;
    saveTrackedPrompt: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            prompt: string;
        };
        output: {
            id: `${string}-${string}-${string}-${string}-${string}`;
        };
        meta: object;
    }>;
    contentMentions: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            keyword: string;
            limit?: number | undefined;
        };
        output: {
            search: unknown[] | null;
            summary: unknown[] | null;
        };
        meta: object;
    }>;
    businessListings: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            query: string;
        };
        output: {
            items: unknown[] | null;
        };
        meta: object;
    }>;
    googleReviews: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            placeId: string;
            depth?: number | undefined;
        };
        output: {
            taskId: string | null;
        };
        meta: object;
    }>;
    domainTechnologies: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            target?: string | undefined;
        };
        output: {} | null;
        meta: object;
    }>;
    domainWhois: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            target?: string | undefined;
        };
        output: {} | null;
        meta: object;
    }>;
    listAlertRules: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            name: string;
            createdAt: Date;
            projectId: string;
            enabled: boolean;
            ruleType: string;
            config: unknown;
        }[];
        meta: object;
    }>;
    createAlertRule: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            name: string;
            ruleType: string;
            config?: Record<string, unknown> | undefined;
        };
        output: {
            id: `${string}-${string}-${string}-${string}-${string}`;
        };
        meta: object;
    }>;
    listAlertEvents: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            createdAt: Date;
            payload: unknown;
            title: string;
            message: string | null;
            projectId: string;
            severity: string;
            ruleId: string | null;
        }[];
        meta: object;
    }>;
    createReportRun: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            reportType: string;
            title: string;
        };
        output: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            payload: {
                project: {
                    name: string;
                    domain: string;
                    location: string;
                };
                domain: {} | null;
                backlinks: {} | null;
                audit: {
                    score: number | null;
                    status: string;
                    summary: unknown;
                } | null;
                ai: {} | null;
                generatedAt: string;
            };
        };
        meta: object;
    }>;
    listReportRuns: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            createdAt: Date;
            payload: unknown;
            title: string;
            projectId: string;
            reportType: string;
        }[];
        meta: object;
    }>;
    usageSummary: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId?: string | undefined;
        };
        output: {
            id: string;
            createdAt: Date;
            userId: string | null;
            teamId: string | null;
            projectId: string | null;
            endpoint: string;
            api: string;
            units: number;
            costEstimate: number | null;
            meta: unknown;
        }[];
        meta: object;
    }>;
    historicalRankOverview: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
            target?: string | undefined;
            days?: number | undefined;
        };
        output: unknown[] | null;
        meta: object;
    }>;
    historicalTraffic: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            target: string;
            projectId: string;
            capturedAt: Date;
            organicTraffic: number | null;
            organicKeywords: number | null;
            paidTraffic: number | null;
            paidKeywords: number | null;
        }[];
        meta: object;
    }>;
    historicalBacklinks: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            target: string;
            projectId: string;
            capturedAt: Date;
            totalBacklinks: number | null;
            referringDomains: number | null;
            newBacklinks: number | null;
            lostBacklinks: number | null;
        }[];
        meta: object;
    }>;
    bulkKeywordIntent: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            keywords: string[];
        };
        output: unknown[] | null;
        meta: object;
    }>;
    bulkKeywordDifficulty: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            keywords: string[];
        };
        output: unknown[] | null;
        meta: object;
    }>;
    topSearches: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            limit?: number | undefined;
        };
        output: unknown[] | null;
        meta: object;
    }>;
    createKeywordCluster: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            name: string;
            primaryKeyword: string;
            keywords: string[];
        };
        output: {
            id: `${string}-${string}-${string}-${string}-${string}`;
        };
        meta: object;
    }>;
    listKeywordClusters: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            name: string;
            createdAt: Date;
            projectId: string;
            primaryKeyword: string;
            keywords: string[];
            searchVolumeTotal: number | null;
            avgDifficulty: number | null;
        }[];
        meta: object;
    }>;
    trafficEstimation: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            targets: string[];
        };
        output: unknown[] | null;
        meta: object;
    }>;
    competitorSnapshot: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            competitor: string;
        };
        output: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            overview: unknown[] | null;
            ranked: unknown[] | null;
            pages: unknown[] | null;
            categories: unknown[] | null;
        };
        meta: object;
    }>;
    domainSubdomains: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            target?: string | undefined;
            limit?: number | undefined;
        };
        output: unknown[] | null;
        meta: object;
    }>;
    analyzeContentGaps: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            competitors: string[];
        };
        output: unknown[] | null;
        meta: object;
    }>;
    generateContentBrief: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            keyword: string;
        };
        output: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            serpData: unknown[] | null;
            relatedKeywords: unknown[] | null;
        };
        meta: object;
    }>;
    listContentBriefs: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            createdAt: Date;
            payload: unknown;
            projectId: string;
            keyword: string;
            targetUrl: string | null;
            wordCount: number | null;
            headings: string[];
            relatedKeywords: string[];
            topCompetitors: {
                url: string;
                wordCount: number | null;
                headingCount: number | null;
            }[];
        }[];
        meta: object;
    }>;
    trackPage: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            url: string;
        };
        output: {
            id: `${string}-${string}-${string}-${string}-${string}`;
        };
        meta: object;
    }>;
    listTrackedPages: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            createdAt: Date;
            url: string;
            projectId: string;
            traffic: number | null;
            keywords: {
                keyword: string;
                position: number | null;
                volume: number | null;
            }[];
            lastCrawled: Date | null;
        }[];
        meta: object;
    }>;
    linkVelocity: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            target?: string | undefined;
        };
        output: unknown[] | null;
        meta: object;
    }>;
    anchorDistribution: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            target?: string | undefined;
        };
        output: unknown[] | null;
        meta: object;
    }>;
    referringNetworks: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            target?: string | undefined;
        };
        output: unknown[] | null;
        meta: object;
    }>;
    generateRecommendations: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            projectId: string;
            type: string;
            category: string;
            title: string;
            description: string;
            impact: string;
            effort: string;
            priority: number;
        }[];
        meta: object;
    }>;
    listRecommendations: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            createdAt: Date;
            metadata: unknown;
            description: string;
            category: string;
            title: string;
            type: string;
            priority: number | null;
            projectId: string;
            impact: string | null;
            effort: string | null;
            actionUrl: string | null;
            dismissed: number;
            completed: number;
        }[];
        meta: object;
    }>;
    dismissRecommendation: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
    appStoreData: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            appId: string;
            platform: "ios" | "android";
        };
        output: unknown;
        meta: object;
    }>;
    mobileVsDesktopRanks: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            keywords: string[];
        };
        output: {
            desktop: unknown[] | null;
            mobile: unknown[] | null;
        };
        meta: object;
    }>;
    googleShoppingData: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            keyword: string;
        };
        output: unknown[] | null;
        meta: object;
    }>;
    updateBudgetAlert: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            projectId: string;
            monthlyBudget: number;
            alertThreshold?: number | undefined;
        };
        output: {
            success: boolean;
        };
        meta: object;
    }>;
    getBudgetAlert: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            projectId: string;
        };
        output: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            enabled: number;
            monthlyBudget: number;
            currentSpend: number;
            alertThreshold: number;
            alertSent: number;
        } | undefined;
        meta: object;
    }>;
}>>;
