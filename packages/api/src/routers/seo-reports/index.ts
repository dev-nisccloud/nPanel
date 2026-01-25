import * as crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import prisma from "@nPanel/db";
import { protectedProcedure, router, type Context } from "../../trpc";
import {
  seoReportCreateInputSchema,
  seoReportDetailSchema,
  seoReportListFiltersSchema,
  seoReportListResponseSchema,
  seoReportSummarySchema,
  seoReportUpdateInputSchema,
} from "./schemas";
import type { SeoReportDetail } from "./schemas";

async function getAuthenticatedUser(ctx: Context) {
  const user = ctx.session?.user;
  if (!user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in." });
  }
  const sessionRole = (user as { role?: string })?.role;
  if (sessionRole) return { id: user.id, role: sessionRole };
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true },
  });
  if (!dbUser) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found." });
  }
  return { id: dbUser.id, role: dbUser.role as string };
}

const isAgencyUser = (role: string) =>
  ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);

function str(val: unknown): string | null {
  if (val == null || val === "") return null;
  return typeof val === "string" ? val : String(val);
}

function bool(val: unknown): boolean | null {
  if (val == null) return null;
  return !!val;
}

async function ensureAccess(userId: string, role: string, report: { userId: string; teamId: string | null }) {
  if (isAgencyUser(role)) return;
  if (report.userId === userId) return;
  if (report.teamId) {
    const m = await prisma.teamMember.findFirst({
      where: { teamId: report.teamId, userId },
      select: { id: true },
    });
    if (m) return;
  }
  throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this report." });
}

function buildReportData(
  input: z.infer<typeof seoReportCreateInputSchema>,
  overwrite: { userId: string; teamId?: string | null }
) {
  const o: Record<string, unknown> = {
    ...overwrite,
    reportMonth: input.reportMonth,
    reportYear: input.reportYear,
    websiteUrl: input.websiteUrl,
    comparisonType: input.comparisonType ?? "NONE",
    dataSource: str(input.dataSource),
    status: input.status ?? "DRAFT",
    executiveSummary: str(input.executiveSummary),
    recommendations: str(input.recommendations),

    organicSessions: str(input.organicSessions),
    organicSessionsPrevious: str(input.organicSessionsPrevious),
    organicUsers: str(input.organicUsers),
    organicUsersPrevious: str(input.organicUsersPrevious),
    organicNewUsers: str(input.organicNewUsers),
    bounceRate: str(input.bounceRate),
    bounceRatePrevious: str(input.bounceRatePrevious),
    avgSessionDurationSeconds: str(input.avgSessionDurationSeconds),
    pagesPerSession: str(input.pagesPerSession),
    engagedSessions: str(input.engagedSessions),
    organicSessionsDesktop: str(input.organicSessionsDesktop),
    organicSessionsMobile: str(input.organicSessionsMobile),
    organicSessionsTablet: str(input.organicSessionsTablet),
    organicSessionsUnbranded: str(input.organicSessionsUnbranded),

    keywordsTracked: str(input.keywordsTracked),
    keywordsTop3: str(input.keywordsTop3),
    keywordsTop10: str(input.keywordsTop10),
    keywordsTop20: str(input.keywordsTop20),
    avgPosition: str(input.avgPosition),
    avgPositionPrevious: str(input.avgPositionPrevious),
    searchVisibility: str(input.searchVisibility),
    impressions: str(input.impressions),
    impressionsPrevious: str(input.impressionsPrevious),
    clicks: str(input.clicks),
    clicksPrevious: str(input.clicksPrevious),
    avgCtr: str(input.avgCtr),
    keywordsGained: str(input.keywordsGained),
    keywordsLost: str(input.keywordsLost),

    conversions: str(input.conversions),
    conversionsPrevious: str(input.conversionsPrevious),
    conversionRate: str(input.conversionRate),
    conversionRatePrevious: str(input.conversionRatePrevious),
    conversionsFromOrganic: str(input.conversionsFromOrganic),
    leadsOrFormSubmissions: str(input.leadsOrFormSubmissions),
    costPerConversion: str(input.costPerConversion),
    bestConvertingPageUrl: str(input.bestConvertingPageUrl),

    totalBacklinks: str(input.totalBacklinks),
    referringDomains: str(input.referringDomains),
    referringDomainsPrevious: str(input.referringDomainsPrevious),
    newReferringDomains: str(input.newReferringDomains),
    lostReferringDomains: str(input.lostReferringDomains),
    newBacklinks: str(input.newBacklinks),
    lostBacklinks: str(input.lostBacklinks),
    dofollowBacklinks: str(input.dofollowBacklinks),
    domainRating: str(input.domainRating),
    domainRatingPrevious: str(input.domainRatingPrevious),
    domainAuthority: str(input.domainAuthority),
    domainAuthorityPrevious: str(input.domainAuthorityPrevious),
    urlRating: str(input.urlRating),
    spamScore: str(input.spamScore),

    siteAuditScore: str(input.siteAuditScore),
    siteAuditScorePrevious: str(input.siteAuditScorePrevious),
    pagesCrawled: str(input.pagesCrawled),
    pagesWithErrors: str(input.pagesWithErrors),
    pagesWithErrorsPrevious: str(input.pagesWithErrorsPrevious),
    pagesWithWarnings: str(input.pagesWithWarnings),
    indexedPages: str(input.indexedPages),
    lcpMs: str(input.lcpMs),
    inpMs: str(input.inpMs),
    cls: str(input.cls),
    coreWebVitalsPassed: bool(input.coreWebVitalsPassed),
    mobileUsabilityIssues: str(input.mobileUsabilityIssues),
    avgPageLoadTimeMs: str(input.avgPageLoadTimeMs),

    gmbViews: str(input.gmbViews),
    gmbSearches: str(input.gmbSearches),
    gmbActions: str(input.gmbActions),
    gmbCalls: str(input.gmbCalls),
    gmbDirectionRequests: str(input.gmbDirectionRequests),
    gmbWebsiteClicks: str(input.gmbWebsiteClicks),
    gmbReviewsCount: str(input.gmbReviewsCount),
    gmbAverageRating: str(input.gmbAverageRating),
    localRanking: str(input.localRanking),
  };
  return o as Record<string, string | boolean | null>;
}

function mapToDetail(r: {
  id: string;
  userId: string;
  teamId: string | null;
  reportMonth: string;
  reportYear: string;
  websiteUrl: string;
  comparisonType: string | null;
  dataSource: string | null;
  status: string;
  executiveSummary: string | null;
  recommendations: string | null;
  organicSessions: string | null;
  organicSessionsPrevious: string | null;
  organicUsers: string | null;
  organicUsersPrevious: string | null;
  organicNewUsers: string | null;
  bounceRate: string | null;
  bounceRatePrevious: string | null;
  avgSessionDurationSeconds: string | null;
  pagesPerSession: string | null;
  engagedSessions: string | null;
  organicSessionsDesktop: string | null;
  organicSessionsMobile: string | null;
  organicSessionsTablet: string | null;
  organicSessionsUnbranded: string | null;
  keywordsTracked: string | null;
  keywordsTop3: string | null;
  keywordsTop10: string | null;
  keywordsTop20: string | null;
  avgPosition: string | null;
  avgPositionPrevious: string | null;
  searchVisibility: string | null;
  impressions: string | null;
  impressionsPrevious: string | null;
  clicks: string | null;
  clicksPrevious: string | null;
  avgCtr: string | null;
  keywordsGained: string | null;
  keywordsLost: string | null;
  conversions: string | null;
  conversionsPrevious: string | null;
  conversionRate: string | null;
  conversionRatePrevious: string | null;
  conversionsFromOrganic: string | null;
  leadsOrFormSubmissions: string | null;
  costPerConversion: string | null;
  bestConvertingPageUrl: string | null;
  totalBacklinks: string | null;
  referringDomains: string | null;
  referringDomainsPrevious: string | null;
  newReferringDomains: string | null;
  lostReferringDomains: string | null;
  newBacklinks: string | null;
  lostBacklinks: string | null;
  dofollowBacklinks: string | null;
  domainRating: string | null;
  domainRatingPrevious: string | null;
  domainAuthority: string | null;
  domainAuthorityPrevious: string | null;
  urlRating: string | null;
  spamScore: string | null;
  siteAuditScore: string | null;
  siteAuditScorePrevious: string | null;
  pagesCrawled: string | null;
  pagesWithErrors: string | null;
  pagesWithErrorsPrevious: string | null;
  pagesWithWarnings: string | null;
  indexedPages: string | null;
  lcpMs: string | null;
  inpMs: string | null;
  cls: string | null;
  coreWebVitalsPassed: boolean | null;
  mobileUsabilityIssues: string | null;
  avgPageLoadTimeMs: string | null;
  gmbViews: string | null;
  gmbSearches: string | null;
  gmbActions: string | null;
  gmbCalls: string | null;
  gmbDirectionRequests: string | null;
  gmbWebsiteClicks: string | null;
  gmbReviewsCount: string | null;
  gmbAverageRating: string | null;
  localRanking: string | null;
  createdAt: Date;
  updatedAt: Date;
  topPages: Array<{
    id: string;
    seoReportId: string;
    url: string;
    pageTitle: string | null;
    clicks: string | null;
    impressions: string | null;
    sessions: string | null;
    conversions: string | null;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
}): SeoReportDetail {
  return seoReportDetailSchema.parse({
    ...r,
    topPages: r.topPages.map((p) => ({
      id: p.id,
      seoReportId: p.seoReportId,
      url: p.url,
      pageTitle: p.pageTitle,
      clicks: p.clicks,
      impressions: p.impressions,
      sessions: p.sessions,
      conversions: p.conversions,
      order: p.order,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  });
}

export const seoReportsRouter = router({
  list: protectedProcedure
    .input(seoReportListFiltersSchema)
    .output(seoReportListResponseSchema)
    .query(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      const filters: Record<string, unknown>[] = [];

      if (!isAgencyUser(user.role)) {
        const memberships = await prisma.teamMember.findMany({
          where: { userId: user.id },
          select: { teamId: true },
        });
        const teamIds = memberships.map((m) => m.teamId);
        filters.push({
          OR: [
            { userId: user.id },
            ...(teamIds.length ? [{ teamId: { in: teamIds } }] : []),
          ],
        });
      }

      if (input.teamId) filters.push({ teamId: input.teamId });
      if (input.status) filters.push({ status: input.status });
      if (input.websiteUrl) filters.push({ websiteUrl: { contains: input.websiteUrl, mode: "insensitive" } });
      if (input.reportYear) filters.push({ reportYear: input.reportYear });
      if (input.reportMonth) filters.push({ reportMonth: input.reportMonth });
      if (input.search?.trim()) {
        const q = input.search.trim();
        filters.push({
          OR: [
            { websiteUrl: { contains: q, mode: "insensitive" } },
            { reportYear: { contains: q, mode: "insensitive" } },
            { reportMonth: { contains: q, mode: "insensitive" } },
            { dataSource: { contains: q, mode: "insensitive" } },
          ],
        });
      }

      const where = filters.length ? { AND: filters } : undefined;

      const [reports, total] = await Promise.all([
        prisma.seoReport.findMany({
          where,
          orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }, { createdAt: "desc" }],
          skip: input.offset,
          take: input.limit,
          select: {
            id: true,
            reportMonth: true,
            reportYear: true,
            websiteUrl: true,
            status: true,
            teamId: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.seoReport.count({ where }),
      ]);

      return {
        reports: reports.map((r) => seoReportSummarySchema.parse(r)),
        total,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .output(seoReportDetailSchema)
    .query(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      const r = await prisma.seoReport.findUnique({
        where: { id: input.id },
        include: { topPages: { orderBy: { order: "asc" } } },
      });
      if (!r) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found." });
      await ensureAccess(user.id, user.role, r);
      return mapToDetail(r);
    }),

  create: protectedProcedure
    .input(seoReportCreateInputSchema)
    .output(seoReportDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      const id = crypto.randomUUID();
      const data = buildReportData(input, { userId: user.id, teamId: input.teamId ?? null });

      await prisma.$transaction(async (tx) => {
        await tx.seoReport.create({
          data: {
            id,
            ...data,
          } as Parameters<typeof tx.seoReport.create>[0]["data"],
        });
        const topPages = input.topPages ?? [];
        for (let i = 0; i < topPages.length; i++) {
          const p = topPages[i];
          await tx.seoReportTopPage.create({
            data: {
              id: crypto.randomUUID(),
              seoReportId: id,
              url: p.url,
              pageTitle: str(p.pageTitle),
              clicks: str(p.clicks),
              impressions: str(p.impressions),
              sessions: str(p.sessions),
              conversions: str(p.conversions),
              order: p.order ?? i,
            },
          });
        }
        await tx.seoReportActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            seoReportId: id,
            userId: user.id,
            action: "CREATE",
            description: "Created SEO report",
            createdAt: new Date(),
          },
        });
      });

      const created = await prisma.seoReport.findUnique({
        where: { id },
        include: { topPages: { orderBy: { order: "asc" } } },
      });
      if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Report not found after create." });
      return mapToDetail(created);
    }),

  update: protectedProcedure
    .input(seoReportUpdateInputSchema)
    .output(seoReportDetailSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      const existing = await prisma.seoReport.findUnique({
        where: { id: input.id },
        select: { id: true, userId: true, teamId: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found." });
      await ensureAccess(user.id, user.role, existing);

      const { id, topPages: topPagesInput, ...rest } = input;
      const full = { reportMonth: "", reportYear: "", websiteUrl: "", ...rest } as z.infer<typeof seoReportCreateInputSchema>;
      const data = buildReportData(full, { userId: existing.userId });
      const updatePayload: Record<string, unknown> = {};
      if (Object.prototype.hasOwnProperty.call(rest, "teamId")) {
        updatePayload.teamId = rest.teamId ?? null;
      }
      for (const k of Object.keys(rest) as (keyof typeof rest)[]) {
        if (k === "teamId") continue;
        if (Object.prototype.hasOwnProperty.call(rest, k) && (rest as Record<string, unknown>)[k] !== undefined) {
          updatePayload[k] = (data as Record<string, unknown>)[k];
        }
      }

      await prisma.$transaction(async (tx) => {
        if (Object.keys(updatePayload).length > 0) {
          await tx.seoReport.update({
            where: { id },
            data: updatePayload as Parameters<typeof tx.seoReport.update>[0]["data"],
          });
        }
        if (topPagesInput !== undefined) {
          await tx.seoReportTopPage.deleteMany({ where: { seoReportId: id } });
          for (let i = 0; i < topPagesInput.length; i++) {
            const p = topPagesInput[i];
            await tx.seoReportTopPage.create({
              data: {
                id: crypto.randomUUID(),
                seoReportId: id,
                url: p.url,
                pageTitle: str(p.pageTitle),
                clicks: str(p.clicks),
                impressions: str(p.impressions),
                sessions: str(p.sessions),
                conversions: str(p.conversions),
                order: p.order ?? i,
              },
            });
          }
        }
        await tx.seoReportActivityLog.create({
          data: {
            id: crypto.randomUUID(),
            seoReportId: id,
            userId: user.id,
            action: "UPDATE",
            description: "Updated SEO report",
            createdAt: new Date(),
          },
        });
      });

      const updated = await prisma.seoReport.findUnique({
        where: { id },
        include: { topPages: { orderBy: { order: "asc" } } },
      });
      if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Report not found after update." });
      return mapToDetail(updated);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const user = await getAuthenticatedUser(ctx);
      const existing = await prisma.seoReport.findUnique({
        where: { id: input.id },
        select: { id: true, userId: true, teamId: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Report not found." });
      await ensureAccess(user.id, user.role, existing);
      await prisma.seoReport.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
