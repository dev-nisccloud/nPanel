import * as crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import prisma from "@nPanel/db";
import { protectedProcedure, router, type Context } from "../../trpc";
import { GoogleSearchConsoleClient } from "../../lib/google-search-console-client";
import { countries } from "@nPanel/location";
import {
  seoReportCreateInputSchema,
  seoReportDetailSchema,
  seoReportListFiltersSchema,
  seoReportListResponseSchema,
  seoReportSummarySchema,
  seoAutomatedReportInputSchema,
  seoAutomatedReportResponseSchema,
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
    reportName: input.reportName,
    reportMonth: input.reportMonth,
    reportYear: input.reportYear,
    websiteUrl: str(input.websiteUrl),
    status: input.status ?? "DRAFT",
    recommendations: str(input.recommendations),
    sessions: str(input.sessions),
    totalWebTraffic: str(input.totalWebTraffic),
    totalViews: str(input.totalViews),
    bounceRate: str(input.bounceRate),
    users: str(input.users),
    returningUsers: str(input.returningUsers),
    eventCount: str(input.eventCount),
    conversions: str(input.conversions),
    sessionDuration: str(input.sessionDuration),
    engagedSessions: str(input.engagedSessions),
    sessionsDesktop: str(input.sessionsDesktop),
    sessionsMobile: str(input.sessionsMobile),
    sessionsTablet: str(input.sessionsTablet),
    formSubmissions: str(input.formSubmissions),
    impressions: str(input.impressions),
    clicks: str(input.clicks),
  };
  return o as Record<string, string | null>;
}

function mapToDetail(r: any): SeoReportDetail {
  return seoReportDetailSchema.parse(r);
}

function getPreviousPeriod(from: string, to: string) {
  const startDate = new Date(from);
  const endDate = new Date(to);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);
  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - diffDays + 1);

  const fromVal = prevStartDate.toISOString().split('T')[0];
  const toVal = prevEndDate.toISOString().split('T')[0];

  if (!fromVal || !toVal) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to calculate previous period dates",
    });
  }

  return {
    from: fromVal,
    to: toVal,
  };
}

export const seoReportsRouter = router({
  getAutomatedReport: protectedProcedure
    .input(seoAutomatedReportInputSchema)
    .output(seoAutomatedReportResponseSchema)
    .query(async ({ input }) => {
      try {
        const gsc = new GoogleSearchConsoleClient();
        const prevPeriod = getPreviousPeriod(input.from, input.to);

        const [
          currentStats,
          prevStats,
          currentKeywords,
          currentPages,
          prevPages,
          currentCountries,
          currentDevices,
          currentAppearance,
          sitemaps
        ] = await Promise.all([
          gsc.getSearchAnalytics(input.siteId, input.from, input.to),
          gsc.getSearchAnalytics(input.siteId, prevPeriod.from, prevPeriod.to),
          gsc.getTopKeywords(input.siteId, input.from, input.to, 50), // Fetch more for opportunity analysis
          gsc.getTopPages(input.siteId, input.from, input.to, 100),
          gsc.getTopPages(input.siteId, prevPeriod.from, prevPeriod.to, 100),
          gsc.getTopCountries(input.siteId, input.from, input.to, 20),
          gsc.getTopDevices(input.siteId, input.from, input.to),
          gsc.getSearchAppearance(input.siteId, input.from, input.to),
          gsc.getSitemaps(input.siteId),
        ]);

        // Summary Statistics
        const calculateSummary = (data: any[]) => {
          let clicks = 0;
          let impressions = 0;
          let sumCtr = 0;
          let sumPos = 0;
          data.forEach(row => {
            clicks += row.clicks || 0;
            impressions += row.impressions || 0;
            sumCtr += row.ctr || 0;
            sumPos += row.position || 0;
          });
          return {
            clicks,
            impressions,
            ctr: data.length > 0 ? (sumCtr / data.length) * 100 : 0,
            pos: data.length > 0 ? sumPos / data.length : 0,
          };
        };

        const currentSummary = calculateSummary(currentStats);
        const prevSummary = calculateSummary(prevStats);

        // Time Series (Current Period)
        const timeSeries = currentStats.map((row: any) => ({
          date: row.keys[0],
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          sessions: 0,
          conversions: 0,
        })).sort((a: any, b: any) => a.date.localeCompare(b.date));

        // Top Keywords
        const allKeywords = currentKeywords.map((k: any) => ({
          query: k.keys[0],
          clicks: k.clicks || 0,
          impressions: k.impressions || 0,
          ctr: (k.ctr || 0) * 100,
          position: k.position || 0,
        }));

        const topKeywords = allKeywords.slice(0, 20);

        // Opportunity Analysis
        const opportunities = {
          pageTwo: allKeywords
            .filter(k => k.position > 10 && k.position <= 20)
            .map(k => ({ ...k, type: "PAGE_TWO" as const }))
            .sort((a, b) => b.impressions - a.impressions)
            .slice(0, 5),
          highPotential: allKeywords
            .filter(k => k.position <= 10 && k.ctr < 1.0 && k.impressions > 50)
            .map(k => ({ ...k, type: "CTR_BOOST" as const }))
            .sort((a, b) => b.impressions - a.impressions)
            .slice(0, 5)
        };

        // Top Devices
        const topDevices = currentDevices.map((d: any) => ({
          device: d.keys[0],
          clicks: d.clicks || 0,
          impressions: d.impressions || 0,
          ctr: (d.ctr || 0) * 100,
          position: d.position || 0,
        }));

        // Search Appearance
        const searchAppearance = currentAppearance.map((a: any) => ({
          appearance: a.keys[0],
          clicks: a.clicks || 0,
          impressions: a.impressions || 0,
          ctr: (a.ctr || 0) * 100,
          position: a.position || 0,
        }));

        // Top Countries
        const topCountries = currentCountries.map((c: any) => {
          const code = (c.keys[0] as string | undefined)?.toUpperCase();
          const countryMatch = countries.find((co: any) => co.alpha3 === code || co.alpha2 === code);
          return {
            country: countryMatch ? countryMatch.name : (c.keys[0] || "Unknown") as string,
            clicks: c.clicks || 0,
            impressions: c.impressions || 0,
            ctr: (c.ctr || 0) * 100,
            position: c.position || 0,
          };
        });

        // Sitemaps
        const mappedSitemaps = sitemaps.map((s: any) => {
          const errors = parseInt(s.errors || "0");
          const warnings = parseInt(s.warnings || "0");
          let statusStr = "Success";
          if (s.isPending) statusStr = "Pending";
          else if (errors > 0) statusStr = "Has errors";
          else if (warnings > 0) statusStr = "Has warnings";

          return {
            path: s.path,
            lastDownloaded: s.lastDownloaded,
            errors,
            warnings,
            status: statusStr,
          };
        });

        // Pages and Trends
        const prevPagesMap = new Map(prevPages.map((p: any) => [p.keys[0], p.clicks || 0]));
        const pagesWithChange = currentPages.map((p: any) => {
          const url = p.keys[0];
          const currClicks = p.clicks || 0;
          const prevClicks = prevPagesMap.get(url) || 0;
          return {
            url,
            clicks: currClicks,
            impressions: p.impressions || 0,
            ctr: (p.ctr || 0) * 100,
            position: p.position || 0,
            clicksChange: currClicks - prevClicks,
          };
        });

        const sortedPages = [...pagesWithChange].sort((a, b) => b.clicks - a.clicks);
        const trendingUp = [...pagesWithChange]
          .filter(p => p.clicksChange > 0)
          .sort((a, b) => b.clicksChange - a.clicksChange);
        const trendingDown = [...pagesWithChange]
          .filter(p => p.clicksChange < 0)
          .sort((a, b) => a.clicksChange - b.clicksChange);

        return {
          summary: {
            totalImpressions: currentSummary.impressions,
            totalImpressionsPrev: prevSummary.impressions,
            totalClicks: currentSummary.clicks,
            totalClicksPrev: prevSummary.clicks,
            averageCtr: currentSummary.ctr,
            averageCtrPrev: prevSummary.ctr,
            averagePosition: currentSummary.pos,
            averagePositionPrev: prevSummary.pos,
          },
          timeSeries,
          topKeywords,
          topPages: {
            top: sortedPages.slice(0, 10),
            trendingUp: trendingUp.slice(0, 5),
            trendingDown: trendingDown.slice(0, 5),
          },
          topCountries,
          topDevices,
          searchAppearance,
          opportunities,
          sitemaps: mappedSitemaps,
        };
      } catch (error) {
        console.error('Failed to fetch automated SEO report:', error);

        // Help debug Google Auth issues in production
        if (error instanceof Error && (error.message.includes('auth') || error.message.includes('credential') || error.message.includes('Service Account'))) {
          console.error('CRITICAL: Google Auth failed. Check GOOGLE_SA_* environment variables.');
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? `Automated SEO Report Error: ${error.message}` : 'Failed to fetch automated SEO report',
        });
      }
    }),

  listManageableSites: protectedProcedure
    .query(async () => {
      try {
        const gsc = new GoogleSearchConsoleClient();
        const sites = await gsc.listSites();
        return sites.map(s => ({
          siteUrl: s.siteUrl || "",
          permissionLevel: s.permissionLevel
        }));
      } catch (error) {
        console.error('Failed to list manageable sites:', error);

        // Help debug Google Auth issues in production
        if (error instanceof Error && (error.message.includes('auth') || error.message.includes('credential') || error.message.includes('Service Account'))) {
          console.error('CRITICAL: Google Auth failed. Check GOOGLE_SA_* environment variables.');
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? `List Sites Error: ${error.message}` : 'Failed to list manageable sites',
        });
      }
    }),

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
      if (input.reportName) filters.push({ reportName: { contains: input.reportName, mode: "insensitive" } });
      if (input.reportYear) filters.push({ reportYear: input.reportYear });
      if (input.reportMonth) filters.push({ reportMonth: input.reportMonth });
      if (input.search?.trim()) {
        const q = input.search.trim();
        filters.push({
          OR: [
            { reportName: { contains: q, mode: "insensitive" } },
            { reportYear: { contains: q, mode: "insensitive" } },
            { reportMonth: { contains: q, mode: "insensitive" } },
            { websiteUrl: { contains: q, mode: "insensitive" } },
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
            reportName: true,
            reportMonth: true,
            reportYear: true,
            websiteUrl: true,
            status: true,
            teamId: true,
            createdAt: true,
            updatedAt: true,
            sessions: true,
            totalWebTraffic: true,
            bounceRate: true,
            impressions: true,
            clicks: true,
            conversions: true,
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
          } as any,
        });
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
      });
      if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Report not found after create." });
      return mapToDetail(created);
    }),
});
