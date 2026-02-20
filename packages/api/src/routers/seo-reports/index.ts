import * as crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import prisma from "@nPanel/db";
import { protectedProcedure, router, type Context } from "../../trpc";
import { GoogleSearchConsoleClient } from "../../lib/google-search-console-client";
import { GoogleAnalyticsClient } from "../../lib/google-analytics-client";
import { countries } from "@nPanel/location";
import {
  seoReportCreateInputSchema,
  seoReportDetailSchema,
  seoReportListFiltersSchema,
  seoReportListResponseSchema,
  seoReportSummarySchema,
  seoAutomatedReportInputSchema,
  seoAutomatedReportResponseSchema,
  seoGa4ReportInputSchema,
  seoGa4PropertySchema,
  seoManageableSiteSchema,
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

// Utility to normalize URLs for matching (strip protocol, trailing slash, www)
function normalizeUrl(url: string | null): string {
  if (!url) return '';
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').toLowerCase();
}

export const seoReportsRouter = router({
  getAutomatedReport: protectedProcedure
    .input(seoAutomatedReportInputSchema)
    .output(seoAutomatedReportResponseSchema)
    .query(async ({ input }) => {
      try {
        const gsc = new GoogleSearchConsoleClient();
        const ga4 = new GoogleAnalyticsClient();
        const prevPeriod = getPreviousPeriod(input.from, input.to);

        // Fetch GSC Data
        const gscPromise = Promise.all([
          gsc.getSearchAnalytics(input.siteId, input.from, input.to),
          gsc.getSearchAnalytics(input.siteId, prevPeriod.from, prevPeriod.to),
          gsc.getTopKeywords(input.siteId, input.from, input.to, 50),
          gsc.getTopPages(input.siteId, input.from, input.to, 100),
          gsc.getTopPages(input.siteId, prevPeriod.from, prevPeriod.to, 100),
          gsc.getTopCountries(input.siteId, input.from, input.to, 20),
          gsc.getTopDevices(input.siteId, input.from, input.to),
          gsc.getSearchAppearance(input.siteId, input.from, input.to),
          gsc.getSitemaps(input.siteId),
        ]);

        // Fetch GA4 Data (if property ID provided) - Allow failure
        const ga4Promise = input.ga4PropertyId ? Promise.allSettled([
          ga4.getOrganicPerformance(input.ga4PropertyId, input.from, input.to),
          ga4.getOrganicPerformance(input.ga4PropertyId, prevPeriod.from, prevPeriod.to),
          ga4.getTopLandingPages(input.ga4PropertyId, input.from, input.to, 100),
        ]) : Promise.resolve(null);

        const [gscResults, ga4Results] = await Promise.all([gscPromise, ga4Promise]);

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
        ] = gscResults;

        // Process GA4 Results if successful
        let ga4Current: any[] = [];
        let ga4Prev: any[] = [];
        let ga4Pages: any[] = [];

        if (ga4Results) {
          if (ga4Results[0].status === 'fulfilled') ga4Current = (ga4Results[0] as any).value?.rows || [];
          if (ga4Results[1].status === 'fulfilled') ga4Prev = (ga4Results[1] as any).value?.rows || [];
          if (ga4Results[2].status === 'fulfilled') ga4Pages = (ga4Results[2] as any).value?.rows || [];
        }

        // Summary Statistics (GSC)
        const calculateGscSummary = (data: any[]) => {
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

        const currentGscSummary = calculateGscSummary(currentStats);
        const prevGscSummary = calculateGscSummary(prevStats);

        // Summary Statistics (GA4)
        const calculateGa4Summary = (data: any[]) => {
          let sessions = 0;
          let users = 0;
          let conversions = 0;
          let sumEngagement = 0;
          let sumBounce = 0;
          let sumDuration = 0;
          const count = data.length;

          data.forEach(row => {
            const metrics = row.metricValues || [];
            sessions += parseInt(metrics[0]?.value || '0');
            users += parseInt(metrics[1]?.value || '0');
            conversions += parseInt(metrics[2]?.value || '0');
            sumBounce += parseFloat(metrics[3]?.value || '0');
            sumEngagement += parseFloat(metrics[4]?.value || '0');
            sumDuration += parseFloat(metrics[5]?.value || '0');
          });

          return {
            sessions,
            users,
            conversions,
            engagementRate: count > 0 ? (sumEngagement / count) * 100 : 0,
            bounceRate: count > 0 ? (sumBounce / count) * 100 : 0,
            averageSessionDuration: count > 0 ? sumDuration / count : 0,
          };
        };

        const currentGa4Summary = calculateGa4Summary(ga4Current);
        const prevGa4Summary = calculateGa4Summary(ga4Prev);


        // Time Series (Merged GSC + GA4)
        const timeSeriesMap = new Map<string, any>();

        // Init with GSC
        currentStats.forEach((row: any) => {
          const date = row.keys[0];
          timeSeriesMap.set(date, {
            date,
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            sessions: 0,
            conversions: 0,
            engagementRate: 0,
            bounceRate: 0,
            averageSessionDuration: 0,
            totalUsers: 0
          });
        });

        // Merge GA4
        ga4Current.forEach((row: any) => {
          const date = row.dimensionValues?.[0]?.value;
          if (date) {
            // GA4 date format is YYYYMMDD, need to convert to YYYY-MM-DD to match GSC
            const formattedDate = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;

            const existing = timeSeriesMap.get(formattedDate) || {
              date: formattedDate,
              clicks: 0,
              impressions: 0,
              sessions: 0,
              conversions: 0,
              engagementRate: 0,
              bounceRate: 0,
              averageSessionDuration: 0,
              totalUsers: 0
            };

            const metrics = row.metricValues || [];
            existing.sessions = parseInt(metrics[0]?.value || '0');
            existing.totalUsers = parseInt(metrics[1]?.value || '0');
            existing.conversions = parseInt(metrics[2]?.value || '0');
            existing.bounceRate = parseFloat(metrics[3]?.value || '0');
            existing.engagementRate = parseFloat(metrics[4]?.value || '0');
            existing.averageSessionDuration = parseFloat(metrics[5]?.value || '0');

            timeSeriesMap.set(formattedDate, existing);
          }
        });

        const timeSeries = Array.from(timeSeriesMap.values()).sort((a, b) => a.date.localeCompare(b.date));

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

        // Pages and Trends (Merged)
        const prevPagesMap = new Map(prevPages.map((p: any) => [p.keys[0], p.clicks || 0]));

        // Map GA4 Pages for easy lookup by path
        const ga4PagesMap = new Map<string, any>();
        ga4Pages.forEach((row: any) => {
          const pagePath = row.dimensionValues?.[0]?.value; // e.g. /blog/post-1
          if (pagePath) ga4PagesMap.set(pagePath, row.metricValues);
        });

        const pagesWithChange = currentPages.map((p: any) => {
          const url = p.keys[0]; // e.g. https://example.com/blog/post-1
          const currClicks = p.clicks || 0;
          const prevClicks = prevPagesMap.get(url) || 0;

          // Try to match with GA4
          let sessions = 0;
          let conversions = 0;
          let engagementRate = 0;
          let bounceRate = 0;
          let averageSessionDuration = 0;

          try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            const ga4Metrics = ga4PagesMap.get(path);
            if (ga4Metrics) {
              sessions = parseInt(ga4Metrics[0]?.value || '0');
              // totalUsers = metrics[1]
              conversions = parseInt(ga4Metrics[2]?.value || '0');
              engagementRate = parseFloat(ga4Metrics[3]?.value || '0');
              bounceRate = parseFloat(ga4Metrics[4]?.value || '0');
              averageSessionDuration = parseFloat(ga4Metrics[5]?.value || '0');
            }
          } catch (e) {
            // invalid url, skip
          }

          return {
            url,
            clicks: currClicks,
            impressions: p.impressions || 0,
            ctr: (p.ctr || 0) * 100,
            position: p.position || 0,
            clicksChange: currClicks - prevClicks,
            sessions,
            conversions,
            engagementRate: engagementRate * 100,
            bounceRate: bounceRate * 100,
            averageSessionDuration
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
            totalImpressions: currentGscSummary.impressions,
            totalImpressionsPrev: prevGscSummary.impressions,
            totalClicks: currentGscSummary.clicks,
            totalClicksPrev: prevGscSummary.clicks,
            averageCtr: currentGscSummary.ctr,
            averageCtrPrev: prevGscSummary.ctr,
            averagePosition: currentGscSummary.pos,
            averagePositionPrev: prevGscSummary.pos,
            // GA4
            totalSessions: currentGa4Summary.sessions,
            totalSessionsPrev: prevGa4Summary.sessions,
            totalUsers: currentGa4Summary.users,
            totalUsersPrev: prevGa4Summary.users,
            averageEngagementRate: currentGa4Summary.engagementRate,
            averageEngagementRatePrev: prevGa4Summary.engagementRate,
            totalConversions: currentGa4Summary.conversions,
            totalConversionsPrev: prevGa4Summary.conversions,
            averageBounceRate: currentGa4Summary.bounceRate,
            averageBounceRatePrev: prevGa4Summary.bounceRate,
            averageSessionDuration: currentGa4Summary.averageSessionDuration,
            averageSessionDurationPrev: prevGa4Summary.averageSessionDuration,
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
    .output(z.array(seoManageableSiteSchema))
    .query(async () => {
      try {
        const gsc = new GoogleSearchConsoleClient();
        const ga4 = new GoogleAnalyticsClient();

        // Fetch sites and properties in parallel
        const [gscSites, ga4Properties] = await Promise.all([
          gsc.listSites(),
          ga4.listAccessibleProperties()
        ]);

        // Match GA4 properties to GSC sites via URL
        return gscSites.map(s => {
          const normalizedSiteUrl = normalizeUrl(s.siteUrl || "");

          // Find a matching GA4 property where the default stream URL matches the GSC site URL
          const matchedGa4 = ga4Properties.find(p => {
            if (!p.defaultUrl) return false;
            return normalizeUrl(p.defaultUrl) === normalizedSiteUrl;
          });

          return {
            siteUrl: s.siteUrl || "",
            permissionLevel: s.permissionLevel || null,
            ga4PropertyId: matchedGa4?.propertyId || null,
            ga4DisplayName: matchedGa4?.displayName || null
          };
        });

      } catch (error) {
        console.error('Failed to list manageable sites:', error);

        // Even if GA4 fails, try to return GSC sites
        try {
          // Fallback to just GSC if complete failure
          if (error instanceof Error && error.message.includes('GA4')) {
            const gsc = new GoogleSearchConsoleClient();
            const sites = await gsc.listSites();
            return sites.map(s => ({
              siteUrl: s.siteUrl || "",
              permissionLevel: s.permissionLevel || null,
              ga4PropertyId: null,
              ga4DisplayName: null
            }));
          }
        } catch (e) {
          // ignore
        }

        if (error instanceof Error && (error.message.includes('auth') || error.message.includes('credential') || error.message.includes('Service Account'))) {
          console.error('CRITICAL: Google Auth failed. Check GOOGLE_SA_* environment variables.');
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? `List Sites Error: ${error.message}` : 'Failed to list manageable sites',
        });
      }
    }),

  /** List GA4 properties independently (no GSC domain matching). User selects which property to view. */
  listGa4Properties: protectedProcedure
    .output(z.array(seoGa4PropertySchema))
    .query(async () => {
      try {
        const ga4 = new GoogleAnalyticsClient();
        const properties = await ga4.listAccessibleProperties();
        return properties.map((p) => ({
          propertyId: p.propertyId,
          displayName: p.displayName,
          defaultUrl: p.defaultUrl ?? null,
        }));
      } catch (error) {
        console.error("Failed to list GA4 properties:", error);
        if (
          error instanceof Error &&
          (error.message.includes("auth") ||
            error.message.includes("credential") ||
            error.message.includes("Service Account"))
        ) {
          console.error("CRITICAL: Google Auth failed. Check GOOGLE_SA_* environment variables.");
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? `List GA4 Properties Error: ${error.message}` : "Failed to list GA4 properties",
        });
      }
    }),

  /** GA4-only report: no GSC linking. Use when user selects a GA4 property directly. */
  getGa4Report: protectedProcedure
    .input(seoGa4ReportInputSchema)
    .output(seoAutomatedReportResponseSchema)
    .query(async ({ input }) => {
      try {
        const ga4 = new GoogleAnalyticsClient();
        const prevPeriod = getPreviousPeriod(input.from, input.to);

        const [ga4Current, ga4Prev, ga4Pages, ga4Countries, ga4Devices] = await Promise.all([
          ga4.getOrganicPerformance(input.ga4PropertyId, input.from, input.to),
          ga4.getOrganicPerformance(input.ga4PropertyId, prevPeriod.from, prevPeriod.to),
          ga4.getTopLandingPages(input.ga4PropertyId, input.from, input.to, 100),
          ga4.getTopCountries(input.ga4PropertyId, input.from, input.to, 20),
          ga4.getTopDevices(input.ga4PropertyId, input.from, input.to),
        ]);

        const ga4CurrentRows = ga4Current?.rows ?? [];
        const ga4PrevRows = ga4Prev?.rows ?? [];

        const calculateGa4Summary = (data: any[]) => {
          let sessions = 0;
          let users = 0;
          let conversions = 0;
          let sumEngagement = 0;
          let sumBounce = 0;
          let sumDuration = 0;
          const count = data.length;
          for (const row of data) {
            const metrics = row.metricValues ?? [];
            sessions += Number.parseInt(metrics[0]?.value ?? "0", 10);
            users += Number.parseInt(metrics[1]?.value ?? "0", 10);
            conversions += Number.parseInt(metrics[2]?.value ?? "0", 10);
            sumBounce += Number.parseFloat(metrics[3]?.value ?? "0");
            sumEngagement += Number.parseFloat(metrics[4]?.value ?? "0");
            sumDuration += Number.parseFloat(metrics[5]?.value ?? "0");
          }
          return {
            sessions,
            users,
            conversions,
            engagementRate: count > 0 ? (sumEngagement / count) * 100 : 0,
            bounceRate: count > 0 ? (sumBounce / count) * 100 : 0,
            averageSessionDuration: count > 0 ? sumDuration / count : 0,
          };
        };

        const currentGa4Summary = calculateGa4Summary(ga4CurrentRows);
        const prevGa4Summary = calculateGa4Summary(ga4PrevRows);

        const timeSeries = ga4CurrentRows.map((row: any) => {
          const dateVal = row.dimensionValues?.[0]?.value;
          const formattedDate = dateVal
            ? `${dateVal.slice(0, 4)}-${dateVal.slice(4, 6)}-${dateVal.slice(6, 8)}`
            : "";
          const metrics = row.metricValues ?? [];
          return {
            date: formattedDate,
            clicks: 0,
            impressions: 0,
            sessions: Number.parseInt(metrics[0]?.value ?? "0", 10),
            totalUsers: Number.parseInt(metrics[1]?.value ?? "0", 10),
            conversions: Number.parseInt(metrics[2]?.value ?? "0", 10),
            bounceRate: Number.parseFloat(metrics[3]?.value ?? "0"),
            engagementRate: Number.parseFloat(metrics[4]?.value ?? "0"),
            averageSessionDuration: Number.parseFloat(metrics[5]?.value ?? "0"),
          };
        });

        const topPagesFromGa4 = (ga4Pages?.rows ?? []).map((row: any) => {
          const path = row.dimensionValues?.[0]?.value ?? "";
          const metrics = row.metricValues ?? [];
          const sessions = Number.parseInt(metrics[0]?.value ?? "0", 10);
          const totalUsers = Number.parseInt(metrics[1]?.value ?? "0", 10);
          const conversions = Number.parseInt(metrics[2]?.value ?? "0", 10);
          const engagementRate = Number.parseFloat(metrics[3]?.value ?? "0");
          const bounceRate = Number.parseFloat(metrics[4]?.value ?? "0");
          const averageSessionDuration = Number.parseFloat(metrics[5]?.value ?? "0");

          return {
            url: path || "/",
            clicks: 0,
            impressions: 0,
            ctr: 0,
            position: 0,
            clicksChange: 0,
            sessions,
            totalUsers,
            conversions,
            engagementRate: engagementRate * 100,
            bounceRate: bounceRate * 100,
            averageSessionDuration,
          };
        });

        const sortedTop = [...topPagesFromGa4].sort((a, b) => (b.sessions ?? 0) - (a.sessions ?? 0));

        const topCountries = (ga4Countries?.rows ?? []).map((row: any) => {
          const code = (row.dimensionValues?.[0]?.value as string | undefined)?.toUpperCase();
          const countryMatch = countries.find((co: any) => co.alpha3 === code || co.alpha2 === code);
          const metrics = row.metricValues ?? [];

          return {
            country: countryMatch ? countryMatch.name : (row.dimensionValues?.[0]?.value || "Unknown") as string,
            clicks: parseInt(metrics[0]?.value || '0'), // Mapping sessions to clicks for consistency in schema
            impressions: parseInt(metrics[1]?.value || '0'), // Mapping users to impressions
            ctr: 0,
            position: 0,
          };
        });

        const topDevices = (ga4Devices?.rows ?? []).map((row: any) => {
          const device = row.dimensionValues?.[0]?.value ?? "Unknown";
          const metrics = row.metricValues ?? [];

          return {
            device,
            clicks: parseInt(metrics[0]?.value || '0'),
            impressions: parseInt(metrics[1]?.value || '0'),
            ctr: 0,
            position: 0,
          };
        });

        return {
          summary: {
            totalImpressions: 0,
            totalImpressionsPrev: 0,
            totalClicks: 0,
            totalClicksPrev: 0,
            averageCtr: 0,
            averageCtrPrev: 0,
            averagePosition: 0,
            averagePositionPrev: 0,
            totalSessions: currentGa4Summary.sessions,
            totalSessionsPrev: prevGa4Summary.sessions,
            totalUsers: currentGa4Summary.users,
            totalUsersPrev: prevGa4Summary.users,
            averageEngagementRate: currentGa4Summary.engagementRate,
            averageEngagementRatePrev: prevGa4Summary.engagementRate,
            totalConversions: currentGa4Summary.conversions,
            totalConversionsPrev: prevGa4Summary.conversions,
            averageBounceRate: currentGa4Summary.bounceRate,
            averageBounceRatePrev: prevGa4Summary.bounceRate,
            averageSessionDuration: currentGa4Summary.averageSessionDuration,
            averageSessionDurationPrev: prevGa4Summary.averageSessionDuration,
          },
          timeSeries: timeSeries.sort((a, b) => a.date.localeCompare(b.date)),
          topKeywords: [],
          topPages: {
            top: sortedTop.slice(0, 10),
            trendingUp: [],
            trendingDown: [],
          },
          topCountries,
          topDevices,
          searchAppearance: [],
          opportunities: { pageTwo: [], highPotential: [] },
          sitemaps: [],
        };
      } catch (error) {
        console.error("Failed to fetch GA4 report:", error);
        if (
          error instanceof Error &&
          (error.message.includes("auth") ||
            error.message.includes("credential") ||
            error.message.includes("Service Account"))
        ) {
          console.error("CRITICAL: Google Auth failed. Check GOOGLE_SA_* environment variables.");
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? `GA4 Report Error: ${error.message}` : "Failed to fetch GA4 report",
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
