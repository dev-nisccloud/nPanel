/**
 * LinkedIn ads for a customer-connected ad account.
 * Reads live from the Marketing API with the customer OAuth token.
 * A LinkedIn campaign group is the campaign shown in this workspace.
 * Campaigns under that group are the ad sets, and creatives are the ads.
 */

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { request } from "undici";
import { z } from "zod";

import { customerPlatformAsset } from "@npanel/db/schema";
import { LinkedInAdsClient } from "../../lib/linkedin-ads-client";
import { decryptToken } from "../../lib/oauth-encryption";
import { router, protectedProcedure } from "../../trpc";
import type { MetaUserProfile } from "../../lib/meta-oauth-provider";

export const LINKEDIN_ADS_SCOPES = ["openid", "profile", "email", "r_ads", "r_ads_reporting"];

const METRIC_FIELDS = [
  "impressions",
  "clicks",
  "costInLocalCurrency",
  "externalWebsiteConversions",
  "oneClickLeads",
  "landingPageClicks",
  "totalEngagements",
  "videoViews",
  "videoCompletions",
  "pivotValues",
  "dateRange",
];

const dateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const timeRangeInput = z
  .object({
    since: dateInput,
    until: dateInput,
  })
  .optional();

type LinkedInDate = { year: number; month: number; day: number };

type InsightTotals = {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  leads: number;
  landingPageClicks: number;
  engagements: number;
  videoViews: number;
  videoCompletions: number;
};

type ContextWithDb = {
  db: {
    query: {
      customerPlatformAsset: {
        findFirst: (args: unknown) => Promise<LinkedInAssetRow | undefined>;
      };
    };
  };
  session: { user: { id: string } };
};

type LinkedInAssetRow = {
  id: string;
  name: string;
  platform: string;
  assetType: string;
  platformAssetId: string;
  currency: string | null;
  isActive: boolean;
  connection: {
    accessToken: string;
    status: string;
  } | null;
};

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseYmd(value: string): LinkedInDate {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function resolveWindow(input?: { since: string; until: string } | null): { since: string; until: string } {
  const today = todayYmd();
  if (!input) {
    return { since: shiftYmd(today, -29), until: today };
  }
  const since = input.since <= input.until ? input.since : input.until;
  const until = input.since <= input.until ? input.until : input.since;
  return { since, until: until > today ? today : until };
}

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function moneyAmount(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" || typeof value === "string") return asNumber(value);
  if (typeof value === "object" && "amount" in value) {
    return asNumber((value as { amount?: unknown }).amount);
  }
  return null;
}

function epochToIso(value: unknown): string | null {
  const millis = asNumber(value);
  if (millis == null || millis <= 0) return null;
  return new Date(millis).toISOString();
}

function emptyTotals(): InsightTotals {
  return {
    impressions: 0,
    clicks: 0,
    spend: 0,
    conversions: 0,
    leads: 0,
    landingPageClicks: 0,
    engagements: 0,
    videoViews: 0,
    videoCompletions: 0,
  };
}

function addElement(totals: InsightTotals, element: Record<string, unknown>) {
  totals.impressions += asNumber(element.impressions) ?? 0;
  totals.clicks += asNumber(element.clicks) ?? 0;
  totals.spend += asNumber(element.costInLocalCurrency) ?? 0;
  totals.conversions += asNumber(element.externalWebsiteConversions) ?? 0;
  totals.leads += asNumber(element.oneClickLeads) ?? 0;
  totals.landingPageClicks += asNumber(element.landingPageClicks) ?? 0;
  totals.engagements += asNumber(element.totalEngagements) ?? 0;
  totals.videoViews += asNumber(element.videoViews) ?? 0;
  totals.videoCompletions += asNumber(element.videoCompletions) ?? 0;
}

function insightView(totals: InsightTotals | null) {
  if (!totals) return null;
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const results = totals.leads || totals.conversions;
  return {
    impressions: totals.impressions,
    clicks: totals.clicks,
    spend: totals.spend,
    ctr: String(ctr),
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : null,
    conversions: totals.conversions,
    leads: totals.leads,
    results,
    costPerResult: results > 0 ? totals.spend / results : null,
    landingPageClicks: totals.landingPageClicks,
    engagements: totals.engagements,
    videoViews: totals.videoViews,
    videoCompletions: totals.videoCompletions,
    reach: totals.impressions,
  };
}

function pivotId(element: Record<string, unknown>): string {
  const values = element.pivotValues;
  const raw = Array.isArray(values) ? values[0] : element.pivotValue;
  const text = raw == null ? "Unknown" : String(raw);
  return text.startsWith("urn:li:") ? text.split(":").pop() || text : text;
}

function humanizePivot(value: string): string {
  const upper = value.toUpperCase();
  if (upper.startsWith("SIZE_")) {
    const raw = upper.replace(/^SIZE_/, "");
    if (raw === "1") return "1 employee";
    if (raw.endsWith("_OR_MORE")) return `${raw.replace("_OR_MORE", "").replace(/_/g, ",")} + employees`;
    const match = raw.match(/^(\d+)_TO_(\d+)$/);
    if (match) return `${Number(match[1]).toLocaleString()}–${Number(match[2]).toLocaleString()} employees`;
  }
  return value.replace(/_/g, " ");
}

function millisOf(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string" && value.length > 0) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  if (value && typeof value === "object" && "time" in value) {
    return millisOf((value as { time?: unknown }).time);
  }
  return null;
}

function createdMillis(entity: Record<string, unknown>): number {
  const stamps = entity.changeAuditStamps as { created?: unknown; lastModified?: unknown } | undefined;
  return (
    millisOf(stamps?.created) ??
    millisOf(entity.created) ??
    millisOf(stamps?.lastModified) ??
    millisOf(entity.lastModified) ??
    millisOf((entity.runSchedule as { start?: unknown } | undefined)?.start) ??
    0
  );
}

function scheduleOf(entity: Record<string, unknown>) {
  const schedule = entity.runSchedule as { start?: unknown; end?: unknown } | undefined;
  return {
    startTime: epochToIso(schedule?.start),
    stopTime: epochToIso(schedule?.end),
  };
}

const TARGETING_FACET_LABELS: Record<string, string> = {
  titles: "Job titles",
  titlesAll: "Job titles",
  titlesPast: "Past job titles",
  seniorities: "Seniority",
  jobFunctions: "Job functions",
  functions: "Job functions",
  industries: "Industries",
  companyIndustry: "Company industries",
  locations: "Locations",
  profileLocations: "Profile locations",
  interfaceLocales: "Languages",
  employers: "Employers",
  employersAll: "Employers",
  employersPast: "Past employers",
  skills: "Skills",
  groups: "Groups",
  degrees: "Degrees",
  fieldsOfStudy: "Fields of study",
  schools: "Schools",
  ageRanges: "Age",
  genders: "Gender",
  yearsOfExperienceRanges: "Years of experience",
  staffCountRanges: "Company size",
  memberInterests: "Interests",
  interests: "Interests",
  memberTraits: "Member traits",
  memberBehaviors: "Member behaviors",
  growthRate: "Company growth",
  followedCompanies: "Followed companies",
  firstDegreeConnectionCompanies: "1st-degree connection companies",
  buyerGroups: "Buyer groups",
  audienceMatchingSegments: "Audience segments",
  dynamicSegments: "Retargeting segments",
};

function facetLabel(facetUrn: string): string {
  const key = facetUrn.split(":").pop() || facetUrn;
  return (
    TARGETING_FACET_LABELS[key] ||
    key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function fallbackTargetingName(urn: string): string {
  const id = urn.includes(":(") ? urn.slice(urn.indexOf(":(") + 1) : urn.split(":").pop() || urn;
  if (urn.includes(":gender:")) {
    if (id.toUpperCase() === "MALE") return "Male";
    if (id.toUpperCase() === "FEMALE") return "Female";
  }
  if (urn.includes(":locale:")) {
    const [language, country] = id.split("_");
    return country ? `${language.toUpperCase()} (${country})` : language.toUpperCase();
  }
  const range = id.match(/^\((-?\d+),(-?\d+)\)$/);
  if (range) {
    const low = Number(range[1]);
    const high = Number(range[2]);
    if (urn.includes(":ageRange:")) return high > 200 ? `${low}+` : `${low}–${high}`;
    if (urn.includes(":staffCountRange:")) {
      return high > 2_000_000 ? `${low.toLocaleString()}+ employees` : `${low.toLocaleString()}–${high.toLocaleString()} employees`;
    }
    if (urn.includes(":growthRate:")) {
      if (low < -2_000_000) return `Declining, under ${high}%`;
      if (high > 2_000_000) return `Growth over ${low}%`;
      return `${low}–${high}% growth`;
    }
  }
  if (urn.includes(":yearsOfExperience:")) {
    const years = Number(id);
    if (Number.isFinite(years)) return years >= 12 ? "12+ years" : `${years}+ years`;
  }
  return id;
}

function collectTargetingUrns(criteria: unknown): string[] {
  return targetingSections(criteria, new Map()).flatMap((section) => section.urns);
}

function targetingSections(
  criteria: unknown,
  names: Map<string, string>,
): Array<{ label: string; values: string; urns: string[] }> {
  if (!criteria || typeof criteria !== "object") return [];
  const root = criteria as Record<string, unknown>;
  const sections: Array<{ label: string; values: string; urns: string[] }> = [];

  for (const scope of ["include", "exclude"] as const) {
    const node = root[scope];
    const blocks =
      node && typeof node === "object" ? (node as { and?: unknown }).and : undefined;
    if (!Array.isArray(blocks)) continue;
    for (const block of blocks) {
      const orData =
        block && typeof block === "object" ? (block as { or?: unknown }).or : undefined;
      if (!orData || typeof orData !== "object") continue;
      for (const [facetUrn, rawValues] of Object.entries(orData as Record<string, unknown>)) {
        if (!Array.isArray(rawValues)) continue;
        const urns = rawValues.filter((value): value is string => typeof value === "string" && value.length > 0);
        if (urns.length === 0) continue;
        const values = urns.map((urn) => names.get(urn) || fallbackTargetingName(urn));
        const label = scope === "exclude" ? `Excluded ${facetLabel(facetUrn).toLowerCase()}` : facetLabel(facetUrn);
        sections.push({ label, values: values.join(", "), urns });
      }
    }
  }

  return sections;
}

async function loadAccount(ctx: ContextWithDb, assetId: string) {
  const asset = await ctx.db.query.customerPlatformAsset.findFirst({
    where: and(eq(customerPlatformAsset.id, assetId), eq(customerPlatformAsset.userId, ctx.session.user.id)),
    with: { connection: true },
  });

  if (!asset?.connection) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Ad account not found" });
  }
  if (asset.assetType !== "linkedin_ad_account" || asset.platform !== "linkedin_ads") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This asset is not a LinkedIn ad account" });
  }
  if (!asset.isActive || asset.connection.status !== "ACTIVE") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This ad account is not active. Reconnect LinkedIn and import it again.",
    });
  }

  return {
    asset,
    client: new LinkedInAdsClient({ accessToken: decryptToken(asset.connection.accessToken) }),
    accountId: asset.platformAssetId,
  };
}

async function analytics(
  client: LinkedInAdsClient,
  window: { since: string; until: string },
  options: {
    accountId: string;
    campaignGroupId?: string;
    timeGranularity?: "ALL" | "DAILY";
    pivot?: string;
  },
) {
  return client.getAnalytics({
    dateRange: { start: parseYmd(window.since), end: parseYmd(window.until) },
    accounts: [options.accountId],
    campaignGroups: options.campaignGroupId ? [options.campaignGroupId] : undefined,
    timeGranularity: options.timeGranularity ?? "ALL",
    fields: METRIC_FIELDS,
    pivots: [{ pivot: options.pivot ?? (options.campaignGroupId ? "CAMPAIGN_GROUP" : "ACCOUNT") }],
  });
}

function totalsByPivot(elements: Array<Record<string, unknown>>) {
  const grouped = new Map<string, InsightTotals>();
  for (const element of elements) {
    const id = pivotId(element);
    const totals = grouped.get(id) ?? emptyTotals();
    addElement(totals, element);
    grouped.set(id, totals);
  }
  return grouped;
}

export function linkedInAuthorizeUrl(redirectUri: string, state: string): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "LINKEDIN_CLIENT_ID environment variable is not set",
    });
  }
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: LINKEDIN_ADS_SCOPES.join(" "),
    prompt: "consent",
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

export async function exchangeLinkedInCode(code: string, redirectUri: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
  scopes: string[];
  profile: MetaUserProfile;
}> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "LinkedIn OAuth credentials are not configured",
    });
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const tokenResponse = await request("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const tokenJson = (await tokenResponse.body.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (!tokenJson.access_token) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: tokenJson.error_description || tokenJson.error || "LinkedIn did not return an access token",
    });
  }

  const profileResponse = await request("https://api.linkedin.com/v2/userinfo", {
    method: "GET",
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const profileJson = (await profileResponse.body.json()) as {
    sub?: string;
    name?: string;
    email?: string;
    picture?: string;
  };
  if (!profileJson.sub) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "LinkedIn did not return a user profile",
    });
  }

  return {
    accessToken: tokenJson.access_token,
    refreshToken: tokenJson.refresh_token ?? null,
    expiresIn: tokenJson.expires_in ?? 60 * 24 * 60 * 60,
    scopes: (tokenJson.scope || LINKEDIN_ADS_SCOPES.join(" ")).split(/[,\s]+/).filter(Boolean),
    profile: {
      platformUserId: profileJson.sub,
      displayName: profileJson.name || "LinkedIn account",
      email: profileJson.email,
      profilePictureUrl: profileJson.picture,
    },
  };
}

export async function listLinkedInSelectableAssets(accessToken: string) {
  const client = new LinkedInAdsClient({ accessToken });
  const response = await client.getAdAccounts();
  return (response.elements ?? []).map((account) => {
    const id = String(account.id);
    const status = account.status || account.accountStatus || null;
    return {
      platformAssetId: id,
      assetType: "linkedin_ad_account",
      name: account.name || `Account ${id}`,
      username: null,
      profilePictureUrl: null,
      description: account.type || null,
      parentAssetId: null,
      accountAccessToken: null,
      accountTokenExpiresAt: null,
      permissions: null,
      capabilities: null,
      businessId: null,
      businessName: null,
      metadata: {
        currency: account.currency ?? null,
        timezone: account.timezone ?? null,
        account_status: status,
        type: account.type ?? null,
        reference: account.reference ?? null,
      },
    };
  });
}

function campaignRow(group: Record<string, unknown>, insights: InsightTotals | null) {
  const schedule = scheduleOf(group);
  const created = createdMillis(group);
  const dailyBudget = moneyAmount(group.dailyBudget);
  const totalBudget = moneyAmount(group.totalBudget);
  const status = typeof group.status === "string" ? group.status : "UNKNOWN";
  return {
    id: String(group.id),
    name: typeof group.name === "string" && group.name ? group.name : "Untitled campaign",
    objective: typeof group.objectiveType === "string" ? group.objectiveType : "",
    status,
    startTime: schedule.startTime,
    stopTime: schedule.stopTime,
    createdAt: created > 0 ? new Date(created).toISOString() : null,
    budget: dailyBudget ?? totalBudget,
    insights: insightView(insights),
  };
}

export const customerOAuthLinkedInRouter = router({
  list: protectedProcedure
    .input(z.object({ assetId: z.string().min(1), timeRange: timeRangeInput }))
    .query(async ({ ctx, input }) => {
      const { client, accountId } = await loadAccount(ctx as ContextWithDb, input.assetId);
      const window = resolveWindow(input.timeRange);
      try {
        const response = await client.getCampaignGroups(accountId);
        const groups = (response.elements ?? []) as Array<Record<string, unknown>>;
        const insights = new Map<string, InsightTotals>();
        try {
          const analyticsResponse = await analytics(client, window, {
            accountId,
            pivot: "CAMPAIGN_GROUP",
          });
          for (const [id, totals] of totalsByPivot(
            (analyticsResponse.elements ?? []) as Array<Record<string, unknown>>,
          )) {
            insights.set(id, totals);
          }
        } catch (error) {
          console.error("Failed to fetch LinkedIn campaign insights:", error);
        }
        const campaigns = groups
          .map((group) => campaignRow(group, insights.get(String(group.id)) ?? null))
          .sort((a, b) => {
            const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
            const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
            if (aTime !== bTime) return bTime - aTime;
            return Number(b.id) - Number(a.id);
          });
        return { campaigns };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Customer OAuth LinkedIn list campaigns error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to list campaigns",
        });
      }
    }),

  getDetails: protectedProcedure
    .input(
      z.object({
        assetId: z.string().min(1),
        campaignId: z.string().min(1),
        timeRange: timeRangeInput,
      }),
    )
    .query(async ({ ctx, input }) => {
      const { asset, client, accountId } = await loadAccount(ctx as ContextWithDb, input.assetId);
      const window = resolveWindow(input.timeRange);
      try {
        const [group, campaignResponse] = await Promise.all([
          client.getCampaignGroupDetails(input.campaignId, accountId) as Promise<Record<string, unknown>>,
          client.getCampaigns(input.campaignId, accountId),
        ]);
        const adSetRecords = (campaignResponse.elements ?? []) as Array<Record<string, unknown>>;
        const adSetIds = new Set(adSetRecords.map((campaign) => String(campaign.id)));

        const [summaryResult, adSetInsightsResult, creativeInsightsResult, creativesResult] =
          await Promise.allSettled([
            analytics(client, window, { accountId, campaignGroupId: input.campaignId, pivot: "CAMPAIGN_GROUP" }),
            analytics(client, window, { accountId, campaignGroupId: input.campaignId, pivot: "CAMPAIGN" }),
            analytics(client, window, { accountId, campaignGroupId: input.campaignId, pivot: "CREATIVE" }),
            client.getAccountCreatives(accountId, { pageSize: 100 }),
          ]);

        const summary =
          summaryResult.status === "fulfilled"
            ? [...totalsByPivot(summaryResult.value.elements as Array<Record<string, unknown>>).values()][0] ??
              emptyTotals()
            : null;
        const adSetInsights =
          adSetInsightsResult.status === "fulfilled"
            ? totalsByPivot(adSetInsightsResult.value.elements as Array<Record<string, unknown>>)
            : new Map<string, InsightTotals>();
        const creativeInsights =
          creativeInsightsResult.status === "fulfilled"
            ? totalsByPivot(creativeInsightsResult.value.elements as Array<Record<string, unknown>>)
            : new Map<string, InsightTotals>();
        const creatives =
          creativesResult.status === "fulfilled"
            ? ((creativesResult.value.elements ?? []) as Array<Record<string, unknown>>)
            : [];

        const adsFor = (campaignId: string) =>
          creatives
            .filter((creative) => {
              const campaign = String(creative.campaign ?? "");
              return campaign.endsWith(`:${campaignId}`) || campaign === campaignId;
            })
            .map((creative) => ({
              id: String(creative.id),
              name:
                typeof creative.name === "string" && creative.name
                  ? creative.name
                  : `Ad ${String(creative.id)}`,
              status:
                (typeof creative.intendedStatus === "string" && creative.intendedStatus) ||
                (typeof creative.status === "string" && creative.status) ||
                "UNKNOWN",
              reviewStatus: typeof creative.reviewStatus === "string" ? creative.reviewStatus : null,
              type: typeof creative.type === "string" ? creative.type : null,
              insights: insightView(creativeInsights.get(String(creative.id)) ?? null),
            }));

        const schedule = scheduleOf(group);
        const targetingNames = await client.resolveTargetingNames(
          adSetRecords.flatMap((campaign) => collectTargetingUrns(campaign.targetingCriteria)),
        );
        return {
          success: true as const,
          currency: asset.currency || "USD",
          accountName: asset.name,
          timeRange: window,
          campaign: {
            id: String(group.id ?? input.campaignId),
            name: typeof group.name === "string" && group.name ? group.name : "Untitled campaign",
            status: typeof group.status === "string" ? group.status : "UNKNOWN",
            objective: typeof group.objectiveType === "string" ? group.objectiveType : "",
            startTime: schedule.startTime,
            stopTime: schedule.stopTime,
            dailyBudget: moneyAmount(group.dailyBudget),
            totalBudget: moneyAmount(group.totalBudget),
            insights: insightView(summary),
          },
          adSets: adSetRecords
            .filter((campaign) => adSetIds.has(String(campaign.id)))
            .map((campaign) => {
              const id = String(campaign.id);
              const adSetSchedule = scheduleOf(campaign);
              return {
                id,
                name: typeof campaign.name === "string" && campaign.name ? campaign.name : `Ad set ${id}`,
                status: typeof campaign.status === "string" ? campaign.status : "UNKNOWN",
                objective: typeof campaign.objectiveType === "string" ? campaign.objectiveType : "",
                costType: typeof campaign.costType === "string" ? campaign.costType : null,
                dailyBudget: moneyAmount(campaign.dailyBudget),
                totalBudget: moneyAmount(campaign.totalBudget),
                unitCost: moneyAmount(campaign.unitCost),
                startTime: adSetSchedule.startTime,
                stopTime: adSetSchedule.stopTime,
                targeting: targetingSections(campaign.targetingCriteria, targetingNames).map(({ label, values }) => ({
                  label,
                  values,
                })),
                insights: insightView(adSetInsights.get(id) ?? null),
                ads: adsFor(id),
              };
            }),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Customer OAuth LinkedIn campaign details error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to load campaign",
        });
      }
    }),

  getAdPreview: protectedProcedure
    .input(z.object({ assetId: z.string().min(1), creativeId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { client, accountId } = await loadAccount(ctx as ContextWithDb, input.assetId);
      const preview = await client.getCreativePreviews(accountId, input.creativeId);
      return {
        unsupported: Boolean(preview.unsupportedCreativeType),
        html: (preview.elements ?? []).map((item) => item.preview).filter((item): item is string => Boolean(item)),
      };
    }),

  getCharts: protectedProcedure
    .input(
      z.object({
        assetId: z.string().min(1),
        campaignId: z.string().min(1),
        timeRange: timeRangeInput,
      }),
    )
    .query(async ({ ctx, input }) => {
      const { client, accountId } = await loadAccount(ctx as ContextWithDb, input.assetId);
      const window = resolveWindow(input.timeRange);
      const pivots = [
        "IMPRESSION_DEVICE_TYPE",
        "PLACEMENT_NAME",
        "SERVING_LOCATION",
        "MEMBER_COMPANY_SIZE",
        "MEMBER_SENIORITY",
        "MEMBER_JOB_FUNCTION",
        "MEMBER_INDUSTRY",
      ] as const;

      const [dailyResult, ...breakdownResults] = await Promise.allSettled([
        analytics(client, window, {
          accountId,
          campaignGroupId: input.campaignId,
          timeGranularity: "DAILY",
          pivot: "CAMPAIGN_GROUP",
        }),
        ...pivots.map((pivot) =>
          analytics(client, window, {
            accountId,
            campaignGroupId: input.campaignId,
            pivot,
          }),
        ),
      ]);

      const dailyMap = new Map<string, InsightTotals & { date: string }>();
      if (dailyResult.status === "fulfilled") {
        for (const element of (dailyResult.value.elements ?? []) as Array<Record<string, unknown>>) {
          const start = (element.dateRange as { start?: LinkedInDate } | undefined)?.start;
          if (!start?.year || !start.month || !start.day) continue;
          const date = `${start.year}-${String(start.month).padStart(2, "0")}-${String(start.day).padStart(2, "0")}`;
          const totals = dailyMap.get(date) ?? { ...emptyTotals(), date };
          addElement(totals, element);
          dailyMap.set(date, totals);
        }
      }

      const breakdown = (result: PromiseSettledResult<Awaited<ReturnType<LinkedInAdsClient["getAnalytics"]>>>) => {
        if (result.status !== "fulfilled") return [];
        return [...totalsByPivot(result.value.elements as Array<Record<string, unknown>>).entries()]
          .map(([label, totals]) => ({
            label: humanizePivot(label),
            impressions: totals.impressions,
            clicks: totals.clicks,
            spend: totals.spend,
          }))
          .sort((a, b) => b.impressions - a.impressions);
      };

      const [device, placement, servingLocation, companySize, seniority, jobFunction, industry] =
        breakdownResults.map(breakdown);

      return {
        success: true as const,
        timeRange: window,
        daily: [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
        device,
        placement,
        servingLocation,
        companySize,
        seniority,
        jobFunction,
        industry,
      };
    }),
});
