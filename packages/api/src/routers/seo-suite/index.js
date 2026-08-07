import * as crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, isNull, or } from "@npanel/db";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { SEO_SUITE_DEFAULT_LANGUAGE_CODE, SEO_SUITE_DEFAULT_LOCATION_CODE, SEO_SUITE_DEFAULT_LOCATION_NAME, seoSuiteAiEntity, seoSuiteAiMentionSnapshot, seoSuiteAlertEvent, seoSuiteAlertRule, seoSuiteAuditIssue, seoSuiteAuditPage, seoSuiteAuditRun, seoSuiteBacklinkSnapshot, seoSuiteDomainSnapshot, seoSuiteKeywordList, seoSuiteProject, seoSuitePromptRun, seoSuiteRankKeyword, seoSuiteRankResult, seoSuiteRankTracker, seoSuiteReportRun, seoSuiteSavedKeyword, seoSuiteSerpCache, seoSuiteTrackedPrompt, seoSuiteVendorUsage, } from "@npanel/db/schema/seo-suite";
import { z } from "zod";
import { assertDataForSeoConfigured, dataForSeoLiveResult, dataForSeoRequest, isDataForSeoConfigured, normalizeDomain, } from "../../lib/dataforseo-client";
import { protectedProcedure, router } from "../../trpc";
import { enqueueSeoSuiteAuditJob, enqueueSeoSuiteRankJob } from "../../lib/qstash/seo-suite-jobs";
import { processSeoSuiteAuditRun, processSeoSuiteRankTracker } from "../../lib/seo-suite-jobs";
import { SeoSuiteService } from "../../services/SeoSuiteService";
async function getAuthenticatedUser(ctx) {
    const user = ctx.session?.user;
    if (!user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in." });
    }
    const sessionRole = user?.role;
    if (sessionRole)
        return { id: user.id, role: sessionRole };
    const dbUser = await db.query.user.findFirst({
        where: eq(userTable.id, user.id),
        columns: { id: true, role: true },
    });
    if (!dbUser) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found." });
    }
    return { id: dbUser.id, role: dbUser.role };
}
const isAgencyUser = (role) => ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);
async function requireAgency(ctx) {
    const user = await getAuthenticatedUser(ctx);
    if (!isAgencyUser(user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Agency access required." });
    }
    return user;
}
async function getProjectOrThrow(projectId) {
    const project = await db.query.seoSuiteProject.findFirst({
        where: eq(seoSuiteProject.id, projectId),
    });
    if (!project || project.archivedAt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "SEO project not found." });
    }
    return project;
}
function usageWriter(ctx) {
    return {
        projectId: ctx.projectId,
        teamId: ctx.teamId,
        userId: ctx.userId,
        onUsage: async (info) => {
            await db.insert(seoSuiteVendorUsage).values({
                id: crypto.randomUUID(),
                projectId: ctx.projectId ?? null,
                teamId: ctx.teamId ?? null,
                userId: ctx.userId ?? null,
                api: info.api,
                endpoint: info.endpoint,
                units: info.units,
                costEstimate: info.costEstimate,
                meta: info.meta ?? null,
                createdAt: new Date(),
            });
        },
    };
}
async function getCachedOrFetch(opts) {
    const now = new Date();
    const existing = await db.query.seoSuiteSerpCache.findFirst({
        where: and(eq(seoSuiteSerpCache.cacheKey, opts.cacheKey)),
    });
    if (existing && existing.expiresAt > now && existing.payload != null) {
        return existing.payload;
    }
    const payload = await opts.fetch();
    const expiresAt = new Date(Date.now() + opts.ttlMs);
    if (existing) {
        await db
            .update(seoSuiteSerpCache)
            .set({ payload, expiresAt, endpoint: opts.endpoint })
            .where(eq(seoSuiteSerpCache.id, existing.id));
    }
    else {
        await db.insert(seoSuiteSerpCache).values({
            id: crypto.randomUUID(),
            projectId: opts.projectId ?? null,
            cacheKey: opts.cacheKey,
            endpoint: opts.endpoint,
            payload,
            expiresAt,
            createdAt: now,
        });
    }
    return payload;
}
const projectCreateSchema = z.object({
    name: z.string().min(1).max(200),
    primaryDomain: z
        .string()
        .min(1)
        .max(255)
        .refine((domain) => {
        // Remove protocol if present
        const cleaned = domain.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
        // Validate domain format (basic check for valid characters and structure)
        const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
        return domainRegex.test(cleaned);
    }, { message: "Please enter a valid domain (e.g., example.com)" })
        .transform((domain) => {
        // Normalize: remove protocol and trailing paths
        return domain.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    }),
    locationCode: z.number().int().optional(),
    locationName: z.string().min(1).optional(),
    languageCode: z.string().min(2).max(10).optional(),
    brandEntities: z.array(z.string()).optional(),
    competitorDomains: z.array(z.string()).optional(),
    teamId: z.string().optional().nullable(),
    gscSiteId: z.string().optional().nullable(),
    ga4PropertyId: z.string().optional().nullable(),
});
const projectUpdateSchema = projectCreateSchema.partial().extend({
    id: z.string().min(1),
});
export const seoSuiteRouter = router({
    credentialsStatus: protectedProcedure.query(async ({ ctx }) => {
        await requireAgency(ctx);
        return { configured: isDataForSeoConfigured() };
    }),
    listProjects: protectedProcedure
        .input(z.object({ search: z.string().optional() }).optional())
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        const search = input?.search?.trim();
        const rows = await db.query.seoSuiteProject.findMany({
            where: and(isNull(seoSuiteProject.archivedAt), search
                ? or(ilike(seoSuiteProject.name, `%${search}%`), ilike(seoSuiteProject.primaryDomain, `%${search}%`))
                : undefined),
            orderBy: [desc(seoSuiteProject.updatedAt)],
        });
        return rows;
    }),
    getProject: protectedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        return getProjectOrThrow(input.id);
    }),
    createProject: protectedProcedure.input(projectCreateSchema).mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const id = crypto.randomUUID();
        const domain = normalizeDomain(input.primaryDomain);
        await db.insert(seoSuiteProject).values({
            id,
            name: input.name.trim(),
            primaryDomain: domain,
            locationCode: input.locationCode ?? SEO_SUITE_DEFAULT_LOCATION_CODE,
            locationName: input.locationName ?? SEO_SUITE_DEFAULT_LOCATION_NAME,
            languageCode: input.languageCode ?? SEO_SUITE_DEFAULT_LANGUAGE_CODE,
            brandEntities: input.brandEntities ?? [],
            competitorDomains: (input.competitorDomains ?? []).map(normalizeDomain),
            teamId: input.teamId ?? null,
            gscSiteId: input.gscSiteId ?? null,
            ga4PropertyId: input.ga4PropertyId ?? null,
            createdById: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        const defaultListId = crypto.randomUUID();
        await db.insert(seoSuiteKeywordList).values({
            id: defaultListId,
            projectId: id,
            name: "Default",
            description: "Default keyword list",
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await db.insert(seoSuiteRankTracker).values({
            id: crypto.randomUUID(),
            projectId: id,
            name: "Default",
            schedule: "weekly",
            device: "desktop",
            engine: "google",
            locationCode: input.locationCode ?? SEO_SUITE_DEFAULT_LOCATION_CODE,
            languageCode: input.languageCode ?? SEO_SUITE_DEFAULT_LANGUAGE_CODE,
            enabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return getProjectOrThrow(id);
    }),
    updateProject: protectedProcedure.input(projectUpdateSchema).mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.id);
        const { id, ...rest } = input;
        await db
            .update(seoSuiteProject)
            .set({
            ...(rest.name !== undefined ? { name: rest.name.trim() } : {}),
            ...(rest.primaryDomain !== undefined
                ? { primaryDomain: normalizeDomain(rest.primaryDomain) }
                : {}),
            ...(rest.locationCode !== undefined ? { locationCode: rest.locationCode } : {}),
            ...(rest.locationName !== undefined ? { locationName: rest.locationName } : {}),
            ...(rest.languageCode !== undefined ? { languageCode: rest.languageCode } : {}),
            ...(rest.brandEntities !== undefined ? { brandEntities: rest.brandEntities } : {}),
            ...(rest.competitorDomains !== undefined
                ? { competitorDomains: rest.competitorDomains.map(normalizeDomain) }
                : {}),
            ...(rest.teamId !== undefined ? { teamId: rest.teamId } : {}),
            ...(rest.gscSiteId !== undefined ? { gscSiteId: rest.gscSiteId } : {}),
            ...(rest.ga4PropertyId !== undefined ? { ga4PropertyId: rest.ga4PropertyId } : {}),
            updatedAt: new Date(),
        })
            .where(eq(seoSuiteProject.id, id));
        return getProjectOrThrow(id);
    }),
    archiveProject: protectedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.id);
        await db
            .update(seoSuiteProject)
            .set({ archivedAt: new Date(), updatedAt: new Date() })
            .where(eq(seoSuiteProject.id, input.id));
        return { ok: true };
    }),
    // ── Keyword research ──────────────────────────────────────────────
    keywordResearch: protectedProcedure
        .input(z.object({
        projectId: z.string().min(1),
        mode: z.enum(["ideas", "suggestions", "related", "for_site"]),
        seeds: z.array(z.string().min(1)).min(1).max(10),
        limit: z.number().int().min(1).max(200).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        assertDataForSeoConfigured();
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const limit = input.limit ?? 50;
        const location_code = project.locationCode;
        const language_code = project.languageCode;
        let path = "";
        let body = [];
        if (input.mode === "ideas") {
            path = "/v3/dataforseo_labs/google/keyword_ideas/live";
            body = [
                {
                    keywords: input.seeds,
                    location_code,
                    language_code,
                    limit,
                    include_serp_info: true,
                },
            ];
        }
        else if (input.mode === "suggestions") {
            path = "/v3/dataforseo_labs/google/keyword_suggestions/live";
            body = [
                {
                    keyword: input.seeds[0],
                    location_code,
                    language_code,
                    limit,
                    include_serp_info: true,
                },
            ];
        }
        else if (input.mode === "related") {
            path = "/v3/dataforseo_labs/google/related_keywords/live";
            body = [
                {
                    keyword: input.seeds[0],
                    location_code,
                    language_code,
                    limit,
                    include_serp_info: true,
                },
            ];
        }
        else {
            path = "/v3/dataforseo_labs/google/keywords_for_site/live";
            body = [
                {
                    target: normalizeDomain(input.seeds[0] || project.primaryDomain),
                    location_code,
                    language_code,
                    limit,
                    include_serp_info: true,
                },
            ];
        }
        const result = await dataForSeoLiveResult(path, body, usage);
        const items = result?.flatMap((block) => {
            const b = block;
            return Array.isArray(b.items) ? b.items : [block];
        }) ?? [];
        return { items, mode: input.mode };
    }),
    keywordOverview: protectedProcedure
        .input(z.object({ projectId: z.string(), keyword: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const cacheKey = `kw-overview:${project.locationCode}:${project.languageCode}:${input.keyword.toLowerCase()}`;
        return getCachedOrFetch({
            projectId: project.id,
            cacheKey,
            endpoint: "/v3/dataforseo_labs/google/keyword_overview/live",
            ttlMs: 24 * 60 * 60 * 1000,
            fetch: async () => {
                const result = await dataForSeoLiveResult("/v3/dataforseo_labs/google/keyword_overview/live", [
                    {
                        keywords: [input.keyword],
                        location_code: project.locationCode,
                        language_code: project.languageCode,
                        include_serp_info: true,
                    },
                ], usage);
                return result?.[0] ?? null;
            },
        });
    }),
    // ── Domain overview ───────────────────────────────────────────────
    domainOverview: protectedProcedure
        .input(z.object({ projectId: z.string(), target: z.string().optional(), includeSubdomains: z.boolean().optional() }))
        .mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const target = normalizeDomain(input.target || project.primaryDomain);
        return await SeoSuiteService.getDomainOverview({
            projectId: project.id,
            domain: target,
            includeSubdomains: input.includeSubdomains ?? true,
            locationCode: project.locationCode,
            languageCode: project.languageCode,
        });
    }),
    latestDomainSnapshot: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        const snapshot = await db.query.seoSuiteDomainSnapshot.findFirst({
            where: eq(seoSuiteDomainSnapshot.projectId, input.projectId),
            orderBy: [desc(seoSuiteDomainSnapshot.capturedAt)],
        });
        if (!snapshot)
            return null;
        return {
            ...snapshot,
            metrics: snapshot.metrics,
            rankedKeywords: snapshot.rankedKeywords,
            pages: snapshot.pages,
        };
    }),
    // ── Competitors ───────────────────────────────────────────────────
    competitorsDomain: protectedProcedure
        .input(z.object({ projectId: z.string(), limit: z.number().int().optional() }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const result = await dataForSeoLiveResult("/v3/dataforseo_labs/google/competitors_domain/live", [
            {
                target: project.primaryDomain,
                location_code: project.locationCode,
                language_code: project.languageCode,
                limit: input.limit ?? 20,
            },
        ], usage);
        return { items: result?.[0] ?? result };
    }),
    keywordGap: protectedProcedure
        .input(z.object({
        projectId: z.string(),
        competitor: z.string().min(1),
        intersections: z.boolean().optional(),
        limit: z.number().int().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const competitor = normalizeDomain(input.competitor);
        const result = await dataForSeoLiveResult("/v3/dataforseo_labs/google/domain_intersection/live", [
            {
                target1: project.primaryDomain,
                target2: competitor,
                location_code: project.locationCode,
                language_code: project.languageCode,
                intersections: input.intersections ?? false,
                limit: input.limit ?? 50,
            },
        ], usage);
        return { items: result?.[0] ?? result, competitor };
    }),
    linkGap: protectedProcedure
        .input(z.object({ projectId: z.string(), competitors: z.array(z.string()).min(1).max(5) }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const targets = [project.primaryDomain, ...input.competitors.map(normalizeDomain)];
        const result = await dataForSeoLiveResult("/v3/backlinks/domain_intersection/live", [
            {
                targets: Object.fromEntries(targets.map((t, i) => [`${i + 1}`, { target: t }])),
                exclude_targets: [project.primaryDomain],
                limit: 50,
            },
        ], usage);
        return { items: result?.[0] ?? result };
    }),
    // ── Backlinks ─────────────────────────────────────────────────────
    backlinksSummary: protectedProcedure
        .input(z.object({ projectId: z.string(), target: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const target = normalizeDomain(input.target || project.primaryDomain);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const cacheKey = `backlinks-summary:${target}`;
        const summary = await getCachedOrFetch({
            projectId: project.id,
            cacheKey,
            endpoint: "/v3/backlinks/summary/live",
            ttlMs: 48 * 60 * 60 * 1000,
            fetch: async () => {
                const result = await dataForSeoLiveResult("/v3/backlinks/summary/live", [{ target, include_subdomains: true }], usage);
                return result?.[0] ?? null;
            },
        });
        await db.insert(seoSuiteBacklinkSnapshot).values({
            id: crypto.randomUUID(),
            projectId: project.id,
            target,
            summary,
            capturedAt: new Date(),
        });
        return summary;
    }),
    backlinksList: protectedProcedure
        .input(z.object({
        projectId: z.string(),
        target: z.string().optional(),
        mode: z.enum(["backlinks", "referring_domains", "anchors"]),
        limit: z.number().int().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const target = normalizeDomain(input.target || project.primaryDomain);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const limit = input.limit ?? 50;
        const pathMap = {
            backlinks: "/v3/backlinks/backlinks/live",
            referring_domains: "/v3/backlinks/referring_domains/live",
            anchors: "/v3/backlinks/anchors/live",
        };
        const result = await dataForSeoLiveResult(pathMap[input.mode], [{ target, limit, order_by: ["rank,desc"] }], usage);
        return { items: result?.[0] ?? result, mode: input.mode };
    }),
    latestBacklinkSnapshot: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        return ((await db.query.seoSuiteBacklinkSnapshot.findFirst({
            where: eq(seoSuiteBacklinkSnapshot.projectId, input.projectId),
            orderBy: [desc(seoSuiteBacklinkSnapshot.capturedAt)],
        })) ?? null);
    }),
    // ── SERP Lab ──────────────────────────────────────────────────────
    serpLive: protectedProcedure
        .input(z.object({
        projectId: z.string(),
        keyword: z.string().min(1),
        device: z.enum(["desktop", "mobile"]).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const result = await dataForSeoLiveResult("/v3/serp/google/organic/live/advanced", [
            {
                keyword: input.keyword,
                location_code: project.locationCode,
                language_code: project.languageCode,
                device: input.device ?? "desktop",
                depth: 20,
            },
        ], usage);
        return result?.[0] ?? null;
    }),
    // ── Saved keywords ────────────────────────────────────────────────
    listKeywordLists: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        return db.query.seoSuiteKeywordList.findMany({
            where: eq(seoSuiteKeywordList.projectId, input.projectId),
            orderBy: [desc(seoSuiteKeywordList.createdAt)],
        });
    }),
    createKeywordList: protectedProcedure
        .input(z.object({ projectId: z.string(), name: z.string().min(1), description: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        const id = crypto.randomUUID();
        await db.insert(seoSuiteKeywordList).values({
            id,
            projectId: input.projectId,
            name: input.name.trim(),
            description: input.description ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return db.query.seoSuiteKeywordList.findFirst({ where: eq(seoSuiteKeywordList.id, id) });
    }),
    listSavedKeywords: protectedProcedure
        .input(z.object({ projectId: z.string(), listId: z.string().optional() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        return db.query.seoSuiteSavedKeyword.findMany({
            where: and(eq(seoSuiteSavedKeyword.projectId, input.projectId), input.listId ? eq(seoSuiteSavedKeyword.listId, input.listId) : undefined),
            orderBy: [desc(seoSuiteSavedKeyword.createdAt)],
        });
    }),
    saveKeywords: protectedProcedure
        .input(z.object({
        projectId: z.string(),
        listId: z.string().optional().nullable(),
        keywords: z.array(z.string().min(1)).min(1).max(100),
        source: z.string().optional(),
        status: z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const rows = input.keywords.map((keyword) => ({
            id: crypto.randomUUID(),
            projectId: project.id,
            listId: input.listId ?? null,
            keyword: keyword.trim(),
            locationCode: project.locationCode,
            languageCode: project.languageCode,
            tags: [],
            source: input.source ?? "manual",
            status: input.status ?? "idea",
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
        await db.insert(seoSuiteSavedKeyword).values(rows);
        return { count: rows.length };
    }),
    deleteSavedKeyword: protectedProcedure
        .input(z.object({ id: z.string(), projectId: z.string() }))
        .mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        await db
            .delete(seoSuiteSavedKeyword)
            .where(and(eq(seoSuiteSavedKeyword.id, input.id), eq(seoSuiteSavedKeyword.projectId, input.projectId)));
        return { ok: true };
    }),
    // ── Rank tracking ─────────────────────────────────────────────────
    getRankTracker: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        const tracker = await db.query.seoSuiteRankTracker.findFirst({
            where: eq(seoSuiteRankTracker.projectId, input.projectId),
        });
        if (!tracker)
            return null;
        const keywords = await db.query.seoSuiteRankKeyword.findMany({
            where: eq(seoSuiteRankKeyword.trackerId, tracker.id),
            orderBy: [desc(seoSuiteRankKeyword.createdAt)],
        });
        return { tracker, keywords };
    }),
    addRankKeywords: protectedProcedure
        .input(z.object({ projectId: z.string(), keywords: z.array(z.string().min(1)).min(1).max(100) }))
        .mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        let tracker = await db.query.seoSuiteRankTracker.findFirst({
            where: eq(seoSuiteRankTracker.projectId, project.id),
        });
        if (!tracker) {
            const id = crypto.randomUUID();
            await db.insert(seoSuiteRankTracker).values({
                id,
                projectId: project.id,
                name: "Default",
                schedule: "weekly",
                device: "desktop",
                engine: "google",
                locationCode: project.locationCode,
                languageCode: project.languageCode,
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            tracker = await db.query.seoSuiteRankTracker.findFirst({
                where: eq(seoSuiteRankTracker.id, id),
            });
        }
        if (!tracker)
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Tracker missing" });
        await db.insert(seoSuiteRankKeyword).values(input.keywords.map((keyword) => ({
            id: crypto.randomUUID(),
            trackerId: tracker.id,
            projectId: project.id,
            keyword: keyword.trim(),
            tags: [],
            createdAt: new Date(),
        })));
        return { ok: true };
    }),
    updateRankTracker: protectedProcedure
        .input(z.object({
        projectId: z.string(),
        schedule: z.enum(["daily", "every_3_days", "weekly"]).optional(),
        device: z.enum(["desktop", "mobile"]).optional(),
        enabled: z.boolean().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        const tracker = await db.query.seoSuiteRankTracker.findFirst({
            where: eq(seoSuiteRankTracker.projectId, input.projectId),
        });
        if (!tracker)
            throw new TRPCError({ code: "NOT_FOUND", message: "Tracker not found" });
        await db
            .update(seoSuiteRankTracker)
            .set({
            ...(input.schedule !== undefined ? { schedule: input.schedule } : {}),
            ...(input.device !== undefined ? { device: input.device } : {}),
            ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
            updatedAt: new Date(),
        })
            .where(eq(seoSuiteRankTracker.id, tracker.id));
        return { ok: true };
    }),
    runRankCheck: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        assertDataForSeoConfigured();
        const tracker = await db.query.seoSuiteRankTracker.findFirst({
            where: eq(seoSuiteRankTracker.projectId, project.id),
        });
        if (!tracker)
            throw new TRPCError({ code: "NOT_FOUND", message: "Tracker not found" });
        const enqueued = await enqueueSeoSuiteRankJob({
            trackerId: tracker.id,
            projectId: project.id,
            userId: user.id,
        });
        if (!enqueued.queued) {
            await processSeoSuiteRankTracker({
                trackerId: tracker.id,
                projectId: project.id,
                userId: user.id,
            });
        }
        return { ok: true, queued: enqueued.queued };
    }),
    listRankResults: protectedProcedure
        .input(z.object({ projectId: z.string(), rankKeywordId: z.string().optional(), limit: z.number().optional() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        return db.query.seoSuiteRankResult.findMany({
            where: and(eq(seoSuiteRankResult.projectId, input.projectId), input.rankKeywordId
                ? eq(seoSuiteRankResult.rankKeywordId, input.rankKeywordId)
                : undefined),
            orderBy: [desc(seoSuiteRankResult.checkedAt)],
            limit: input.limit ?? 100,
        });
    }),
    // ── Site audit ────────────────────────────────────────────────────
    listAuditRuns: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        return db.query.seoSuiteAuditRun.findMany({
            where: eq(seoSuiteAuditRun.projectId, input.projectId),
            orderBy: [desc(seoSuiteAuditRun.createdAt)],
        });
    }),
    startAudit: protectedProcedure
        .input(z.object({
        projectId: z.string(),
        targetUrl: z.string().url().optional(),
        maxPages: z.number().int().min(1).max(500).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        assertDataForSeoConfigured();
        const targetUrl = input.targetUrl ??
            (project.primaryDomain.startsWith("http")
                ? project.primaryDomain
                : `https://${project.primaryDomain}`);
        const id = crypto.randomUUID();
        await db.insert(seoSuiteAuditRun).values({
            id,
            projectId: project.id,
            targetUrl,
            status: "pending",
            maxPages: input.maxPages ?? 100,
            createdAt: new Date(),
        });
        const enqueued = await enqueueSeoSuiteAuditJob({
            auditRunId: id,
            projectId: project.id,
            userId: user.id,
        });
        if (!enqueued.queued) {
            await processSeoSuiteAuditRun({
                auditRunId: id,
                projectId: project.id,
                userId: user.id,
            });
        }
        return { id, queued: enqueued.queued };
    }),
    getAuditRun: protectedProcedure
        .input(z.object({ projectId: z.string(), auditRunId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        const run = await db.query.seoSuiteAuditRun.findFirst({
            where: and(eq(seoSuiteAuditRun.id, input.auditRunId), eq(seoSuiteAuditRun.projectId, input.projectId)),
        });
        if (!run)
            throw new TRPCError({ code: "NOT_FOUND", message: "Audit run not found" });
        const issues = await db.query.seoSuiteAuditIssue.findMany({
            where: eq(seoSuiteAuditIssue.auditRunId, run.id),
        });
        const pages = await db.query.seoSuiteAuditPage.findMany({
            where: eq(seoSuiteAuditPage.auditRunId, run.id),
            limit: 100,
        });
        return { run, issues, pages };
    }),
    instantPageAudit: protectedProcedure
        .input(z.object({ projectId: z.string(), url: z.string().url() }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const result = await dataForSeoLiveResult("/v3/on_page/instant_pages", [
            {
                url: input.url,
                enable_javascript: true,
                load_resources: true,
                enable_browser_rendering: false,
            },
        ], usage);
        return result?.[0] ?? null;
    }),
    // ── AI Visibility ─────────────────────────────────────────────────
    listAiEntities: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        return db.query.seoSuiteAiEntity.findMany({
            where: eq(seoSuiteAiEntity.projectId, input.projectId),
        });
    }),
    upsertAiEntities: protectedProcedure
        .input(z.object({
        projectId: z.string(),
        entities: z.array(z.object({ entityType: z.string(), value: z.string().min(1) })),
    }))
        .mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        await db.delete(seoSuiteAiEntity).where(eq(seoSuiteAiEntity.projectId, input.projectId));
        if (input.entities.length) {
            await db.insert(seoSuiteAiEntity).values(input.entities.map((e) => ({
                id: crypto.randomUUID(),
                projectId: input.projectId,
                entityType: e.entityType,
                value: e.value.trim(),
                createdAt: new Date(),
            })));
        }
        return { ok: true };
    }),
    refreshAiVisibility: protectedProcedure
        .input(z.object({
        projectId: z.string(),
        platform: z.enum(["google", "chat_gpt"]).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const entities = await db.query.seoSuiteAiEntity.findMany({
            where: eq(seoSuiteAiEntity.projectId, project.id),
        });
        const targets = entities.length > 0
            ? entities.map((e) => e.entityType === "domain"
                ? { domain: normalizeDomain(e.value) }
                : { keyword: e.value })
            : [{ domain: project.primaryDomain }];
        const result = await dataForSeoLiveResult("/v3/ai_optimization/llm_mentions/search_mentions/live", [
            {
                target: targets,
                platform: input.platform,
                location_code: project.locationCode,
                language_code: project.languageCode,
                limit: 50,
            },
        ], usage);
        await db.insert(seoSuiteAiMentionSnapshot).values({
            id: crypto.randomUUID(),
            projectId: project.id,
            platform: input.platform ?? "all",
            payload: result,
            capturedAt: new Date(),
        });
        return { items: result };
    }),
    latestAiMentionSnapshot: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        return ((await db.query.seoSuiteAiMentionSnapshot.findFirst({
            where: eq(seoSuiteAiMentionSnapshot.projectId, input.projectId),
            orderBy: [desc(seoSuiteAiMentionSnapshot.capturedAt)],
        })) ?? null);
    }),
    // ── Prompt Explorer ───────────────────────────────────────────────
    runPromptExplorer: protectedProcedure
        .input(z.object({
        projectId: z.string(),
        prompt: z.string().min(1).max(4000),
        models: z.array(z.enum(["chatgpt", "claude", "gemini", "perplexity"])).min(1),
        confirmCost: z.literal(true),
    }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        assertDataForSeoConfigured();
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const modelPath = {
            chatgpt: "/v3/ai_optimization/chat_gpt/llm_responses/live",
            claude: "/v3/ai_optimization/claude/llm_responses/live",
            gemini: "/v3/ai_optimization/gemini/llm_responses/live",
            perplexity: "/v3/ai_optimization/perplexity/llm_responses/live",
        };
        const results = {};
        for (const model of input.models) {
            try {
                const path = modelPath[model];
                const result = await dataForSeoLiveResult(path, [{ user_prompt: input.prompt, max_output_tokens: 1024 }], usage);
                results[model] = result?.[0] ?? result;
            }
            catch (err) {
                results[model] = {
                    error: err instanceof Error ? err.message : "Failed",
                };
            }
        }
        const id = crypto.randomUUID();
        await db.insert(seoSuitePromptRun).values({
            id,
            projectId: project.id,
            prompt: input.prompt,
            models: input.models,
            results,
            createdAt: new Date(),
        });
        return { id, results };
    }),
    listPromptRuns: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        return db.query.seoSuitePromptRun.findMany({
            where: eq(seoSuitePromptRun.projectId, input.projectId),
            orderBy: [desc(seoSuitePromptRun.createdAt)],
            limit: 20,
        });
    }),
    listTrackedPrompts: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        return db.query.seoSuiteTrackedPrompt.findMany({
            where: eq(seoSuiteTrackedPrompt.projectId, input.projectId),
            orderBy: [desc(seoSuiteTrackedPrompt.createdAt)],
        });
    }),
    saveTrackedPrompt: protectedProcedure
        .input(z.object({ projectId: z.string(), prompt: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        const id = crypto.randomUUID();
        await db.insert(seoSuiteTrackedPrompt).values({
            id,
            projectId: input.projectId,
            prompt: input.prompt.trim(),
            tags: [],
            createdAt: new Date(),
        });
        return { id };
    }),
    // ── Content analysis ──────────────────────────────────────────────
    contentMentions: protectedProcedure
        .input(z.object({ projectId: z.string(), keyword: z.string().min(1), limit: z.number().optional() }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const [search, summary] = await Promise.all([
            dataForSeoLiveResult("/v3/content_analysis/search/live", [{ keyword: input.keyword, limit: input.limit ?? 30 }], usage),
            dataForSeoLiveResult("/v3/content_analysis/summary/live", [{ keyword: input.keyword }], usage),
        ]);
        return { search, summary };
    }),
    // ── Local & reviews ───────────────────────────────────────────────
    businessListings: protectedProcedure
        .input(z.object({ projectId: z.string(), query: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const result = await dataForSeoLiveResult("/v3/business_data/business_listings/search/live", [
            {
                categories: [],
                description: input.query,
                title: input.query,
                location_coordinate: undefined,
                limit: 20,
            },
        ], usage);
        return { items: result };
    }),
    googleReviews: protectedProcedure
        .input(z.object({ projectId: z.string(), placeId: z.string().min(1), depth: z.number().optional() }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const envelope = await dataForSeoRequest("/v3/business_data/google/reviews/task_post", {
            method: "POST",
            body: [
                {
                    place_id: input.placeId,
                    location_code: project.locationCode,
                    language_code: project.languageCode,
                    depth: input.depth ?? 20,
                },
            ],
            usage,
        });
        return { taskId: envelope.tasks?.[0]?.id ?? null };
    }),
    // ── Tech & WHOIS ──────────────────────────────────────────────────
    domainTechnologies: protectedProcedure
        .input(z.object({ projectId: z.string(), target: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const target = normalizeDomain(input.target || project.primaryDomain);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const result = await dataForSeoLiveResult("/v3/domain_analytics/technologies/domain_technologies/live", [{ target }], usage);
        return result?.[0] ?? null;
    }),
    domainWhois: protectedProcedure
        .input(z.object({ projectId: z.string(), target: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const target = normalizeDomain(input.target || project.primaryDomain);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const result = await dataForSeoLiveResult("/v3/domain_analytics/whois/overview/live", [{ target }], usage);
        return result?.[0] ?? null;
    }),
    // ── Reports & alerts ──────────────────────────────────────────────
    listAlertRules: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        return db.query.seoSuiteAlertRule.findMany({
            where: eq(seoSuiteAlertRule.projectId, input.projectId),
        });
    }),
    createAlertRule: protectedProcedure
        .input(z.object({
        projectId: z.string(),
        name: z.string().min(1),
        ruleType: z.string().min(1),
        config: z.record(z.string(), z.unknown()).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        const id = crypto.randomUUID();
        await db.insert(seoSuiteAlertRule).values({
            id,
            projectId: input.projectId,
            name: input.name,
            ruleType: input.ruleType,
            config: input.config ?? {},
            enabled: true,
            createdAt: new Date(),
        });
        return { id };
    }),
    listAlertEvents: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        return db.query.seoSuiteAlertEvent.findMany({
            where: eq(seoSuiteAlertEvent.projectId, input.projectId),
            orderBy: [desc(seoSuiteAlertEvent.createdAt)],
            limit: 50,
        });
    }),
    createReportRun: protectedProcedure
        .input(z.object({
        projectId: z.string(),
        reportType: z.string().min(1),
        title: z.string().min(1),
    }))
        .mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const [domainSnap, backlinkSnap, latestAudit, aiSnap] = await Promise.all([
            db.query.seoSuiteDomainSnapshot.findFirst({
                where: eq(seoSuiteDomainSnapshot.projectId, project.id),
                orderBy: [desc(seoSuiteDomainSnapshot.capturedAt)],
            }),
            db.query.seoSuiteBacklinkSnapshot.findFirst({
                where: eq(seoSuiteBacklinkSnapshot.projectId, project.id),
                orderBy: [desc(seoSuiteBacklinkSnapshot.capturedAt)],
            }),
            db.query.seoSuiteAuditRun.findFirst({
                where: eq(seoSuiteAuditRun.projectId, project.id),
                orderBy: [desc(seoSuiteAuditRun.createdAt)],
            }),
            db.query.seoSuiteAiMentionSnapshot.findFirst({
                where: eq(seoSuiteAiMentionSnapshot.projectId, project.id),
                orderBy: [desc(seoSuiteAiMentionSnapshot.capturedAt)],
            }),
        ]);
        const id = crypto.randomUUID();
        const payload = {
            project: {
                name: project.name,
                domain: project.primaryDomain,
                location: project.locationName,
            },
            domain: domainSnap?.payload ?? null,
            backlinks: backlinkSnap?.summary ?? null,
            audit: latestAudit
                ? { score: latestAudit.score, status: latestAudit.status, summary: latestAudit.summary }
                : null,
            ai: aiSnap?.payload ?? null,
            generatedAt: new Date().toISOString(),
        };
        await db.insert(seoSuiteReportRun).values({
            id,
            projectId: project.id,
            reportType: input.reportType,
            title: input.title,
            payload,
            createdAt: new Date(),
        });
        return { id, payload };
    }),
    listReportRuns: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        return db.query.seoSuiteReportRun.findMany({
            where: eq(seoSuiteReportRun.projectId, input.projectId),
            orderBy: [desc(seoSuiteReportRun.createdAt)],
            limit: 20,
        });
    }),
    usageSummary: protectedProcedure
        .input(z.object({ projectId: z.string().optional() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        const rows = await db.query.seoSuiteVendorUsage.findMany({
            where: input.projectId
                ? eq(seoSuiteVendorUsage.projectId, input.projectId)
                : undefined,
            orderBy: [desc(seoSuiteVendorUsage.createdAt)],
            limit: 100,
        });
        return rows;
    }),
    // ── Historical Data & Trends ──────────────────────────────────────────────
    historicalRankOverview: protectedProcedure
        .input(z.object({ projectId: z.string(), target: z.string().optional(), days: z.number().optional() }))
        .query(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const target = normalizeDomain(input.target || project.primaryDomain);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const cacheKey = `historical-rank:${project.locationCode}:${project.languageCode}:${target}`;
        const payload = await getCachedOrFetch({
            projectId: project.id,
            cacheKey,
            endpoint: "/v3/dataforseo_labs/google/historical_rank_overview/live",
            ttlMs: 24 * 60 * 60 * 1000,
            fetch: async () => {
                return dataForSeoLiveResult("/v3/dataforseo_labs/google/historical_rank_overview/live", [
                    {
                        target,
                        location_code: project.locationCode,
                        language_code: project.languageCode,
                        date_from: new Date(Date.now() - (input.days || 90) * 24 * 60 * 60 * 1000)
                            .toISOString()
                            .split("T")[0],
                    },
                ], usage);
            },
        });
        return payload;
    }),
    historicalTraffic: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        return db.query.seoSuiteHistoricalTraffic.findMany({
            where: eq(seoSuiteHistoricalTraffic.projectId, input.projectId),
            orderBy: [desc(seoSuiteHistoricalTraffic.capturedAt)],
            limit: 90,
        });
    }),
    historicalBacklinks: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        return db.query.seoSuiteHistoricalBacklink.findMany({
            where: eq(seoSuiteHistoricalBacklink.projectId, input.projectId),
            orderBy: [desc(seoSuiteHistoricalBacklink.capturedAt)],
            limit: 90,
        });
    }),
    // ── Advanced Keyword Features ─────────────────────────────────────────────
    bulkKeywordIntent: protectedProcedure
        .input(z.object({ projectId: z.string(), keywords: z.array(z.string().min(1)).min(1).max(100) }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const payload = await dataForSeoLiveResult("/v3/dataforseo_labs/google/bulk_search_intent/live", [
            {
                keywords: input.keywords,
                location_code: project.locationCode,
                language_code: project.languageCode,
            },
        ], usage);
        // Save to DB
        const { seoSuiteKeywordIntent } = await import("@npanel/db/schema");
        const items = (payload?.[0]?.items || []);
        await db.insert(seoSuiteKeywordIntent).values(items.map((item) => ({
            id: crypto.randomUUID(),
            projectId: project.id,
            keyword: item.keyword || "",
            intent: item.intent || "unknown",
            intentProbability: item.intent_probability || null,
            payload,
        }))).onConflictDoNothing();
        return payload;
    }),
    bulkKeywordDifficulty: protectedProcedure
        .input(z.object({ projectId: z.string(), keywords: z.array(z.string().min(1)).min(1).max(1000) }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        return dataForSeoLiveResult("/v3/dataforseo_labs/google/bulk_keyword_difficulty/live", [
            {
                keywords: input.keywords,
                location_code: project.locationCode,
                language_code: project.languageCode,
            },
        ], usage);
    }),
    topSearches: protectedProcedure
        .input(z.object({ projectId: z.string(), limit: z.number().optional() }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        return dataForSeoLiveResult("/v3/dataforseo_labs/google/top_searches/live", [
            {
                location_code: project.locationCode,
                language_code: project.languageCode,
                limit: input.limit || 100,
            },
        ], usage);
    }),
    createKeywordCluster: protectedProcedure
        .input(z.object({
        projectId: z.string(),
        name: z.string().min(1),
        primaryKeyword: z.string().min(1),
        keywords: z.array(z.string()),
    }))
        .mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        const { seoSuiteKeywordCluster } = await import("@npanel/db/schema");
        const id = crypto.randomUUID();
        await db.insert(seoSuiteKeywordCluster).values({
            id,
            projectId: input.projectId,
            name: input.name,
            primaryKeyword: input.primaryKeyword,
            keywords: input.keywords,
        });
        return { id };
    }),
    listKeywordClusters: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        const { seoSuiteKeywordCluster } = await import("@npanel/db/schema");
        return db.query.seoSuiteKeywordCluster.findMany({
            where: eq(seoSuiteKeywordCluster.projectId, input.projectId),
            orderBy: [desc(seoSuiteKeywordCluster.createdAt)],
        });
    }),
    // ── Competitor Deep Dive ──────────────────────────────────────────────────
    trafficEstimation: protectedProcedure
        .input(z.object({ projectId: z.string(), targets: z.array(z.string()).min(1).max(10) }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        return dataForSeoLiveResult("/v3/dataforseo_labs/google/bulk_traffic_estimation/live", [
            {
                targets: input.targets,
                location_code: project.locationCode,
                language_code: project.languageCode,
            },
        ], usage);
    }),
    competitorSnapshot: protectedProcedure
        .input(z.object({ projectId: z.string(), competitor: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const [overview, ranked, pages, categories] = await Promise.all([
            dataForSeoLiveResult("/v3/dataforseo_labs/google/domain_rank_overview/live", [
                {
                    target: input.competitor,
                    location_code: project.locationCode,
                    language_code: project.languageCode,
                },
            ], usage),
            dataForSeoLiveResult("/v3/dataforseo_labs/google/ranked_keywords/live", [
                {
                    target: input.competitor,
                    location_code: project.locationCode,
                    language_code: project.languageCode,
                    limit: 100,
                },
            ], usage),
            dataForSeoLiveResult("/v3/dataforseo_labs/google/relevant_pages/live", [
                {
                    target: input.competitor,
                    location_code: project.locationCode,
                    language_code: project.languageCode,
                    limit: 50,
                },
            ], usage),
            dataForSeoLiveResult("/v3/dataforseo_labs/google/categories_for_domain/live", [
                {
                    target: input.competitor,
                    location_code: project.locationCode,
                    language_code: project.languageCode,
                },
            ], usage),
        ]);
        const { seoSuiteCompetitorSnapshot } = await import("@npanel/db/schema");
        const id = crypto.randomUUID();
        await db.insert(seoSuiteCompetitorSnapshot).values({
            id,
            projectId: project.id,
            competitorDomain: input.competitor,
            payload: { overview, ranked, pages, categories },
        });
        return { id, overview, ranked, pages, categories };
    }),
    domainSubdomains: protectedProcedure
        .input(z.object({ projectId: z.string(), target: z.string().optional(), limit: z.number().optional() }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const target = normalizeDomain(input.target || project.primaryDomain);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        return dataForSeoLiveResult("/v3/dataforseo_labs/google/subdomains/live", [
            {
                target,
                location_code: project.locationCode,
                language_code: project.languageCode,
                limit: input.limit || 100,
            },
        ], usage);
    }),
    // ── Content Strategy ──────────────────────────────────────────────────────
    analyzeContentGaps: protectedProcedure
        .input(z.object({ projectId: z.string(), competitors: z.array(z.string()).min(1).max(5) }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        // Find keywords competitors rank for but we don't
        const gaps = await dataForSeoLiveResult("/v3/dataforseo_labs/google/keyword_gap/live", [
            {
                target: project.primaryDomain,
                competitors: input.competitors,
                location_code: project.locationCode,
                language_code: project.languageCode,
                limit: 500,
            },
        ], usage);
        return gaps;
    }),
    generateContentBrief: protectedProcedure
        .input(z.object({ projectId: z.string(), keyword: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        // Get top ranking pages for the keyword
        const [serpData, relatedKeywords] = await Promise.all([
            dataForSeoLiveResult("/v3/serp/google/organic/live/advanced", [
                {
                    keyword: input.keyword,
                    location_code: project.locationCode,
                    language_code: project.languageCode,
                    depth: 10,
                },
            ], usage),
            dataForSeoLiveResult("/v3/dataforseo_labs/google/related_keywords/live", [
                {
                    keyword: input.keyword,
                    location_code: project.locationCode,
                    language_code: project.languageCode,
                    limit: 50,
                },
            ], usage),
        ]);
        const { seoSuiteContentBrief } = await import("@npanel/db/schema");
        const id = crypto.randomUUID();
        await db.insert(seoSuiteContentBrief).values({
            id,
            projectId: project.id,
            keyword: input.keyword,
            payload: { serpData, relatedKeywords },
        });
        return { id, serpData, relatedKeywords };
    }),
    listContentBriefs: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        const { seoSuiteContentBrief } = await import("@npanel/db/schema");
        return db.query.seoSuiteContentBrief.findMany({
            where: eq(seoSuiteContentBrief.projectId, input.projectId),
            orderBy: [desc(seoSuiteContentBrief.createdAt)],
            limit: 50,
        });
    }),
    // ── Page-Level Analysis ───────────────────────────────────────────────────
    trackPage: protectedProcedure
        .input(z.object({ projectId: z.string(), url: z.string().url() }))
        .mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        const { seoSuitePageTracking } = await import("@npanel/db/schema");
        const id = crypto.randomUUID();
        await db.insert(seoSuitePageTracking).values({
            id,
            projectId: input.projectId,
            url: input.url,
        });
        return { id };
    }),
    listTrackedPages: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        const { seoSuitePageTracking } = await import("@npanel/db/schema");
        return db.query.seoSuitePageTracking.findMany({
            where: eq(seoSuitePageTracking.projectId, input.projectId),
            orderBy: [desc(seoSuitePageTracking.createdAt)],
        });
    }),
    // ── Link Intelligence ─────────────────────────────────────────────────────
    linkVelocity: protectedProcedure
        .input(z.object({ projectId: z.string(), target: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const target = normalizeDomain(input.target || project.primaryDomain);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const history = await dataForSeoLiveResult("/v3/backlinks/history/live", [
            {
                target,
            },
        ], usage);
        return history;
    }),
    anchorDistribution: protectedProcedure
        .input(z.object({ projectId: z.string(), target: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const target = normalizeDomain(input.target || project.primaryDomain);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const anchors = await dataForSeoLiveResult("/v3/backlinks/anchors/live", [
            {
                target,
                limit: 1000,
            },
        ], usage);
        return anchors;
    }),
    referringNetworks: protectedProcedure
        .input(z.object({ projectId: z.string(), target: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const target = normalizeDomain(input.target || project.primaryDomain);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        return dataForSeoLiveResult("/v3/backlinks/referring_networks/live", [
            {
                target,
                limit: 100,
            },
        ], usage);
    }),
    // ── Smart Recommendations ─────────────────────────────────────────────────
    generateRecommendations: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        // TODO: Implement AI-powered recommendation engine
        // For now, return placeholder recommendations
        const { seoSuiteRecommendation } = await import("@npanel/db/schema");
        const recommendations = [
            {
                id: crypto.randomUUID(),
                projectId: project.id,
                type: "quick_win",
                category: "keyword",
                title: "Add high-volume keywords to rank tracker",
                description: "We found 15 keywords with search volume >1000 that you're not tracking yet",
                impact: "medium",
                effort: "low",
                priority: 80,
            },
        ];
        await db.insert(seoSuiteRecommendation).values(recommendations);
        return recommendations;
    }),
    listRecommendations: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        const { seoSuiteRecommendation } = await import("@npanel/db/schema");
        return db.query.seoSuiteRecommendation.findMany({
            where: eq(seoSuiteRecommendation.projectId, input.projectId),
            orderBy: [desc(seoSuiteRecommendation.priority)],
        });
    }),
    dismissRecommendation: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        const { seoSuiteRecommendation } = await import("@npanel/db/schema");
        await db
            .update(seoSuiteRecommendation)
            .set({ dismissed: 1 })
            .where(eq(seoSuiteRecommendation.id, input.id));
        return { success: true };
    }),
    // ── Mobile & App SEO ──────────────────────────────────────────────────────
    appStoreData: protectedProcedure
        .input(z.object({ projectId: z.string(), appId: z.string(), platform: z.enum(["ios", "android"]) }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const endpoint = input.platform === "ios"
            ? "/v3/app_data/apple/app_info/task_post"
            : "/v3/app_data/google/app_info/task_post";
        return dataForSeoRequest(endpoint, [{ app_id: input.appId }], usage);
    }),
    mobileVsDesktopRanks: protectedProcedure
        .input(z.object({ projectId: z.string(), keywords: z.array(z.string()).min(1) }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        const [desktop, mobile] = await Promise.all([
            dataForSeoLiveResult("/v3/serp/google/organic/live/advanced", input.keywords.map((keyword) => ({
                keyword,
                location_code: project.locationCode,
                language_code: project.languageCode,
                device: "desktop",
            })), usage),
            dataForSeoLiveResult("/v3/serp/google/organic/live/advanced", input.keywords.map((keyword) => ({
                keyword,
                location_code: project.locationCode,
                language_code: project.languageCode,
                device: "mobile",
            })), usage),
        ]);
        return { desktop, mobile };
    }),
    // ── E-commerce SEO ────────────────────────────────────────────────────────
    googleShoppingData: protectedProcedure
        .input(z.object({ projectId: z.string(), keyword: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
        const user = await requireAgency(ctx);
        const project = await getProjectOrThrow(input.projectId);
        const usage = usageWriter({
            projectId: project.id,
            teamId: project.teamId,
            userId: user.id,
        });
        return dataForSeoLiveResult("/v3/merchant/google/products/task_post", [
            {
                keyword: input.keyword,
                location_code: project.locationCode,
                language_code: project.languageCode,
            },
        ], usage);
    }),
    // ── Cost Controls ─────────────────────────────────────────────────────────
    updateBudgetAlert: protectedProcedure
        .input(z.object({
        projectId: z.string(),
        monthlyBudget: z.number().positive(),
        alertThreshold: z.number().min(0).max(1).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        const { seoSuiteBudgetAlert } = await import("@npanel/db/schema");
        const existing = await db.query.seoSuiteBudgetAlert.findFirst({
            where: eq(seoSuiteBudgetAlert.projectId, input.projectId),
        });
        if (existing) {
            await db
                .update(seoSuiteBudgetAlert)
                .set({
                monthlyBudget: input.monthlyBudget,
                alertThreshold: input.alertThreshold,
            })
                .where(eq(seoSuiteBudgetAlert.projectId, input.projectId));
        }
        else {
            await db.insert(seoSuiteBudgetAlert).values({
                id: crypto.randomUUID(),
                projectId: input.projectId,
                monthlyBudget: input.monthlyBudget,
                alertThreshold: input.alertThreshold || 0.8,
            });
        }
        return { success: true };
    }),
    getBudgetAlert: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
        await requireAgency(ctx);
        await getProjectOrThrow(input.projectId);
        const { seoSuiteBudgetAlert } = await import("@npanel/db/schema");
        return db.query.seoSuiteBudgetAlert.findFirst({
            where: eq(seoSuiteBudgetAlert.projectId, input.projectId),
        });
    }),
});
